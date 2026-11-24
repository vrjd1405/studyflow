const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function repeatFields(item) {
  if (item?.seriesId) return '<p class="sectionnote">Repeating task · Changes apply to this occurrence.</p>';
  return `<fieldset class="repeat"><legend>Repeat</legend>
    <label>Schedule<select class="field" name="repeatMode" onchange="showRepeat(this.form)">
      <option value="once">Once</option><option value="weekly">Weekly or every day</option><option value="dates">Specific dates</option></select></label>
    <div data-mode="weekly" hidden><p>Select weekdays or <button type="button" class="link" onclick="this.form.querySelectorAll('[name=weekday]').forEach(box=>box.checked=true)">select every day</button></p>
    <div class="weekdays">${weekdayNames.map((d,i)=>`<label><input type="checkbox" name="weekday" value="${i}">${d}</label>`).join('')}</div>
    <label>Repeat through (inclusive)<input class="field" type="date" name="until"></label></div>
    <div data-mode="dates" hidden><p>The main date is included. Add other dates below.</p><div class="date-add"><input class="field" type="date" aria-label="Additional date"><button type="button" class="secondary" onclick="addRepeatDate(this.form)">Add date</button></div><div class="date-chips"></div></div></fieldset>`;
}
function showRepeat(form) {
  for (const panel of form.querySelectorAll('[data-mode]')) panel.hidden=panel.dataset.mode!==form.repeatMode.value;
  if(form.repeatMode.value==='weekly'&&!form.until.value&&form.date.value){
    form.until.value=dateOffset(form.date.value,27);
    const day=new Date(form.date.value+'T12:00:00').getDay();
    form.querySelectorAll('[name=weekday]')[day].checked=true;
  }
}
function addRepeatDate(form) {
  const input=form.querySelector('.date-add input'), date=input.value;
  if(!date)return toast('Choose a date first');
  if(date===form.date.value||Array.from(form.querySelectorAll('[name=extraDate]')).some(x=>x.value===date))return toast('Date already included');
  const chip=document.createElement('button');
  chip.type='button';chip.className='pill';chip.textContent=date+' ×';chip.setAttribute('aria-label','Remove '+date);
  const value=document.createElement('input');value.type='hidden';value.name='extraDate';value.value=date;
  chip.append(value);chip.onclick=()=>chip.remove();form.querySelector('.date-chips').append(chip);input.value='';
}
function occurrenceDates(start,mode,until,days,extra) {
  if(mode==='dates')return [...new Set([start,...extra].filter(Boolean))].sort();
  if(mode!=='weekly')return [start];
  if(!days.length)throw Error('Choose at least one weekday');
  if(!until||until<start||until>dateOffset(start,365))throw Error('Choose an end date within one year of the start date');
  const dates=[];
  for(let date=start;date<=until;date=dateOffset(date,1)){
    if(days.includes(new Date(date+'T12:00:00').getDay()))dates.push(date);
  }
  if(!dates.length)throw Error('The selected range contains none of those weekdays');
  return dates;
}
function savePlannerItem(e){
  e.preventDefault();
  const form=e.target, data=new FormData(form);
  const entry={type:state.itemType};
  for(const key of ['title','categoryId','date','time','priority','notes'])entry[key]=String(data.get(key)||'').trim();
  if(!entry.title||!entry.date||!entry.categoryId)return toast('Complete the title, date and subject');
  entry.endTime=String(data.get('endTime')||'');
  if(Boolean(entry.time)!==Boolean(entry.endTime))return toast('Enter both start and end times, or leave both empty for an anytime activity');
  entry.duration=entry.time?(clockMinutes(entry.endTime)-clockMinutes(entry.time)+1440)%1440||1440:30;
  entry.reminder=data.has('reminder');
  const previous=state.edit&&db.items.find(x=>x.id===state.edit);
  const mode=entry.type==='task'&&!previous?.seriesId?data.get('repeatMode'):'once';
  let dates;
  try{
    dates=occurrenceDates(entry.date,mode,data.get('until'),data.getAll('weekday').map(Number),[...data.getAll('extraDate'),form.querySelector('.date-add input')?.value]);
  }catch(error){return toast(error.message)}
  const seriesId=mode==='dates'||mode==='weekly'?uid():previous?.seriesId;
  dates.forEach((date,i)=>{
    const item={...entry,date};
    if(seriesId)item.seriesId=seriesId;
    if(i===0&&previous)Object.assign(previous,item);
    else db.items.push({...item,id:uid(),done:false});
  });
  save();closeModal();render();toast(dates.length===1?'Activity saved':dates.length+' occurrences scheduled');
}
function removeFuture(){
  const item=db.items.find(x=>x.id===state.edit);
  if(!item?.seriesId||!confirm('Delete this and later unfinished occurrences in this series?'))return;
  db.items=db.items.filter(x=>x.seriesId!==item.seriesId||x.date<item.date||x.done);
  save();closeModal();render();
}

function startTime(item){return new Date(item.date+'T'+item.time).getTime()}
function livePlan(now) {
  const timed=db.items.filter(x=>x.time&&!x.done);
  const current=timed.filter(x=>startTime(x)<=now&&now<(x.endTime?new Date((x.endTime<=x.time?dateOffset(x.date,1):x.date)+'T'+x.endTime).getTime():startTime(x)+(Number(x.duration)||30)*60000)).sort((a,b)=>startTime(b)-startTime(a));
  const next=timed.filter(x=>startTime(x)>now).sort((a,b)=>startTime(a)-startTime(b))[0];
  return {current,next};
}
function liveCards(now=new Date()){
  const {current,next}=livePlan(+now);
  function card(item,label,empty){
    return `<section class="live-card"><div class="live-label">${label}</div>${item?`<button class="live-title" data-id="${esc(item.id)}" onclick="openItem(this.dataset.id)">${esc(item.title)}</button><div class="sub">${fmtDate(item.date)} · ${activityRange(item)} · ${esc(cat(item.categoryId).name)}</div>`:`<strong>${empty}</strong>`}</section>`;
  }
  return `<div class="live-grid">${card(current[0],'<i class="green-dot"></i> Current activity'+(current.length>1?' · '+current.length+' overlap':''),'No activity in progress')}${card(next,'Up next','No upcoming timed activities')}</div>`;
}
function todayTimeline(now=new Date()){
  const minutes=now.getHours()*60+now.getMinutes(), plan=byDate(localToday());
  const marker=`<div class="now-line"><span>${esc(now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}))} · Now</span></div>`;
  const timed=plan.filter(x=>x.time), anytime=plan.filter(x=>!x.time);
  let inserted=false;
  const rows=timed.map(x=>{
    const [h,m]=x.time.split(':').map(Number);
    const before=!inserted&&60*h+m>minutes;
    if(before)inserted=true;
    return (before?marker:'')+taskrow(x);
  }).join('');
  return rows+(inserted?'':marker)+(anytime.length?'<h3 class="list-date">Anytime</h3>'+anytime.map(taskrow).join(''):'');
}
async function enableAlerts(){
  if(!('Notification' in window))return toast('This browser supports in-app reminders only');
  try{const permission=await Notification.requestPermission();toast(permission==='granted'?'Device notifications enabled':'In-app reminders are active')}catch{toast('Device notifications unavailable')}
}
function dueReminder(x,now){
  const age=now-startTime(x);
  return x.time&&!x.done&&x.reminder!==false&&age>=0&&age<60000;
}
async function remind(now){
  for(const x of db.items.filter(item=>dueReminder(item,now))){
    const key='studyflow-alert:'+x.id;
    const stamp=x.date+'T'+x.time;
    if(localStorage.getItem(key)===stamp)continue;
    localStorage.setItem(key,stamp);
    let tray=document.querySelector('#due-tray');
    if(!tray){tray=document.createElement('div');tray.id='due-tray';tray.setAttribute('role','status');document.body.append(tray)}
    const panel=document.createElement('section');panel.className='due-alert';
    panel.innerHTML=`<div class="live-label"><i class="green-dot"></i> Due now · ${fmtTime(x.time)}</div><strong>${esc(x.title)}</strong><div class="sub">${esc(cat(x.categoryId).name)}</div><button class="secondary">Dismiss</button>`;
    panel.querySelector('button').onclick=()=>panel.remove();tray.append(panel);
    if('Notification' in window&&Notification.permission==='granted'){
      try{
        const reg=await navigator.serviceWorker?.getRegistration();
        if(reg)await reg.showNotification(x.title,{body:fmtTime(x.time)+' · '+cat(x.categoryId).name,icon:'./icons/icon-192.png',tag:key});
      }catch{}
    }
  }
}
let liveMinute='';
function refreshPlanner(){
  const now=new Date(),minute=localToday()+now.getHours()+':'+now.getMinutes();
  if(minute!==liveMinute){
    if(liveMinute&&liveMinute.slice(0,10)!==localToday()&&state.screen==='home'&&!state.modal)render();
    const cards=document.querySelector('#live-cards'),timeline=document.querySelector('#today-timeline');
    if(cards)cards.innerHTML=liveCards(now);
    if(timeline)timeline.innerHTML=todayTimeline(now);
    liveMinute=minute;
  }
  if(navigator.locks)navigator.locks.request('studyflow-due-alert',{ifAvailable:true},lock=>lock&&remind(+now)).catch(()=>{});
  else remind(+now).catch(()=>{});
}
window.addEventListener('load',()=>{refreshPlanner();setInterval(refreshPlanner,5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPlanner()})});

function clockMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}
function clockValue(minutes) {
  const value = ((minutes % 1440) + 1440) % 1440;
  return [Math.floor(value / 60), value % 60].map(n => String(n).padStart(2,'0')).join(':');
}
function endClock(item) {
  if (!item?.time) return '';
  return item.endTime || clockValue(clockMinutes(item.time) + (Number(item.duration) || 30));
}
function activityRange(item) {
  if (!item.time) return fmtTime('');
  const end = endClock(item);
  return fmtTime(item.time) + ' – ' + fmtTime(end) + (end <= item.time ? ' (+1 day)' : '');
}
function clockFields(item) {
  return `<fieldset class="clock-fields"><legend>Activity time</legend><div class="clock-inputs">
    ${[['time','Start time',item?.time],['endTime','End time',endClock(item)]].map(([name,label,value])=>`<div><label>${label}<input class="field" type="time" name="${name}" value="${esc(value||'')}" oninput="syncClock(this.form)"></label><button type="button" class="link" onclick="openClock(this.form,'${name}')">Set on clock</button></div>`).join('')}
    </div><div class="clock-editor" hidden></div><small class="clock-caption" aria-live="polite"></small></fieldset>`;
}
function syncClock(form) {
  const start=form.elements.time.value, end=form.elements.endTime.value;
  form.querySelector('.clock-caption').textContent=start&&end&&end<=start?'Ends the following day':'';
}
function openClock(form, field) {
  const editor=form.querySelector('.clock-editor');
  editor.hidden=false;
  editor.dataset.field=field;
  editor.dataset.unit='hour';
  const now=new Date();
  editor.dataset.value=form.elements[field].value || clockValue(field==='endTime'&&form.elements.time.value?clockMinutes(form.elements.time.value)+30:now.getHours()*60+now.getMinutes());
  editor.innerHTML=`<div class="clock-controls"><strong>${field==='time'?'Start time':'End time'}</strong><output></output></div>
    <div class="clock-controls">${['hour','minute','AM','PM'].map(key=>`<button type="button" class="pill" data-choice="${key}">${key==='hour'?'Hour':key==='minute'?'Minute':key}</button>`).join('')}</div>
    <div class="dial" role="slider" tabindex="0" aria-label="Clock hand"><i></i></div><div class="clock-controls"><button type="button" class="secondary" data-cancel>Cancel</button><button type="button" class="primary" data-apply>Set time</button></div>`;
  const dial=editor.querySelector('.dial');
  for(let i=0;i<12;i++){
    const mark=document.createElement('span'),angle=i*Math.PI/6;
    mark.style.left=(50+40*Math.sin(angle))+'%';mark.style.top=(50-40*Math.cos(angle))+'%';dial.append(mark);
  }
  function draw() {
    const minutes=clockMinutes(editor.dataset.value), hours=editor.dataset.unit==='hour';
    const position=hours?Math.floor(minutes/60)%12:minutes%60;
    dial.style.setProperty('--angle',(position*(hours?30:6))+'deg');
    dial.querySelectorAll('span').forEach((el,i)=>el.textContent=hours?(i||12):String(i*5).padStart(2,'0'));
    dial.setAttribute('aria-label',hours?'Hour':'Minute');
    dial.setAttribute('aria-valuemin',hours?'1':'0');dial.setAttribute('aria-valuemax',hours?'12':'59');
    dial.setAttribute('aria-valuenow',hours?(position||12):position);
    editor.querySelector('output').textContent=fmtTime(editor.dataset.value);
    for(const b of editor.querySelectorAll('[data-choice]'))b.setAttribute('aria-pressed',String([editor.dataset.unit,minutes>=720?'PM':'AM'].includes(b.dataset.choice)));
  }
  function setPosition(index) {
    const value=clockMinutes(editor.dataset.value);
    editor.dataset.value=clockValue(editor.dataset.unit==='hour'?(value>=720?720:0)+(index%12)*60+value%60:value-value%60+index%60);
    draw();
  }
  function point(event) {
    const rect=dial.getBoundingClientRect();
    const angle=Math.atan2(event.clientX-rect.left-rect.width/2,rect.top+rect.height/2-event.clientY);
    const count=editor.dataset.unit==='hour'?12:60;
    setPosition((Math.round(angle*count/(2*Math.PI))+count)%count);
  }
  dial.onpointerdown=e=>{dial.setPointerCapture(e.pointerId);point(e)};
  dial.onpointermove=e=>{if(dial.hasPointerCapture(e.pointerId))point(e)};
  dial.onpointerup=e=>{point(e);dial.releasePointerCapture(e.pointerId);editor.dataset.unit='minute';draw()};
  dial.onkeydown=e=>{
    if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const hour=editor.dataset.unit==='hour',count=hour?12:60,value=clockMinutes(editor.dataset.value);
    setPosition(((hour?Math.floor(value/60):value)+count+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1))%count);
  };
  editor.onclick=e=>{
    const key=e.target.dataset.choice;
    if(key==='hour'||key==='minute')editor.dataset.unit=key;
    if(key==='AM'||key==='PM')editor.dataset.value=clockValue(clockMinutes(editor.dataset.value)%720+(key==='PM'?720:0));
    if(e.target.hasAttribute('data-apply')){
      form.elements[field].value=editor.dataset.value;
      if(field==='time'&&!form.elements.endTime.value)form.elements.endTime.value=clockValue(clockMinutes(editor.dataset.value)+30);
      syncClock(form);
    }
    if(e.target.hasAttribute('data-apply')||e.target.hasAttribute('data-cancel')){editor.hidden=true;form.elements[field].focus();return}
    draw();
  };
  draw();dial.focus();
}
