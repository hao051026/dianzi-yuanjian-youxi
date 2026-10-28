"use strict";
/* 电子社小游戏厅 · 账号与成绩（浏览器本地存储版） */
var ES=(function(){
  var USERS="es_users",CUR="es_current";
  function ls(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function ss(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function rm(k){try{localStorage.removeItem(k);}catch(e){}}
  function users(){try{return JSON.parse(ls(USERS)||"{}");}catch(e){return {};}}
  function saveUsers(u){ss(USERS,JSON.stringify(u));}
  function fnv(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
  function h256(str){
    if(window.crypto&&window.crypto.subtle&&window.crypto.subtle.digest&&window.TextEncoder){
      return window.crypto.subtle.digest("SHA-256",new TextEncoder().encode(str)).then(function(buf){
        var a=new Uint8Array(buf),s="";
        for(var i=0;i<a.length;i++){s+=(a[i]<16?"0":"")+a[i].toString(16);}
        return s;
      }).catch(function(){return fnv(str);});
    }
    return Promise.resolve(fnv(str));
  }
  function hash(pw,salt){return h256(salt+"|"+pw+"|es");}
  function validName(n){return typeof n==="string"&&/^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/.test(n);}
  function validPw(p){return typeof p==="string"&&p.length>=4&&p.length<=32;}
  function user(){return ls(CUR);}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function register(n,pw){
    if(!validName(n))return Promise.resolve({ok:false,msg:"名字需 2–16 位中文 / 字母 / 数字 / 下划线"});
    if(!validPw(pw))return Promise.resolve({ok:false,msg:"密码需 4–32 位"});
    var u=users();
    if(u[n])return Promise.resolve({ok:false,msg:"这个名字已经被注册啦，换一个吧"});
    var salt=Math.random().toString(36).slice(2,10);
    return hash(pw,salt).then(function(h){
      var uu=users();
      if(uu[n])return {ok:false,msg:"这个名字已经被注册啦，换一个吧"};
      uu[n]={h:h,s:salt,t:Date.now()};
      saveUsers(uu);
      ss(CUR,n);
      return {ok:true,user:n};
    });
  }
  function login(n,pw){
    var u=users();
    if(!u[n])return Promise.resolve({ok:false,msg:"没有找到这个用户，先注册一个吧"});
    return hash(pw,u[n].s).then(function(h){
      if(h===u[n].h){ss(CUR,n);return {ok:true,user:n};}
      return {ok:false,msg:"密码不对，再想想"};
    });
  }
  function logout(){rm(CUR);}
  function lb(game){try{return JSON.parse(ls("es_lb_"+game)||"[]");}catch(e){return [];}}
  function record(game,value,display){
    var u=user();
    if(!u){
      toast('登录后才能把成绩记入排行榜 · <a href="login.html" style="color:#FFD9A8;font-weight:bold;">去登录</a>',3200);
      return {saved:false};
    }
    var v=Math.round(value*100)/100, s=String(display==null?"":display);
    var arr=lb(game);
    arr.push({u:u,v:v,s:s,d:Date.now()});
    arr.sort(function(a,b){return b.v-a.v;});
    arr=arr.slice(0,50);
    ss("es_lb_"+game,JSON.stringify(arr));
    var r=0;
    for(var i=arr.length-1;i>=0;i--){
      if(arr[i].u===u&&arr[i].v===v&&arr[i].s===s){r=i+1;break;}
    }
    toast("🏆 成绩已记入排行榜"+(r>0?" · 当前第 "+r+" 名":""),2600);
    return {saved:true,rank:r};
  }
  function top(game,n){return lb(game).slice(0,n||5);}
  function myBest(game){
    var u=user();if(!u)return null;
    var arr=lb(game).filter(function(e){return e.u===u;});
    return arr.length?arr[0]:null;
  }
  function toast(html,ms){
    if(!document.body)return;
    var t=document.createElement("div");
    t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(74,74,74,.93);color:#fff;padding:10px 20px;border-radius:99px;font-size:13px;font-family:'Microsoft YaHei',sans-serif;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,.35);max-width:88%;text-align:center;line-height:1.6;";
    t.innerHTML=html;
    document.body.appendChild(t);
    setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},ms||2500);
  }
  function mountChip(el){
    if(!el)return;
    var u=user();
    if(u){
      el.innerHTML='<div style="text-align:center;margin-top:8px;font-size:13px;color:#7d7070;">👤 <b style="color:#4A4A4A">'+esc(u)+'</b>'
        +' · <a href="#" id="eslogout" style="color:#b8878d;text-decoration:none;">退出登录</a></div>';
      var a=el.querySelector("#eslogout");
      if(a)a.onclick=function(e){e.preventDefault();logout();location.reload();};
    }else{
      el.innerHTML='<div style="text-align:center;margin-top:8px;font-size:13px;color:#7d7070;">👤 未登录 · '
        +'<a href="login.html" style="color:#b8878d;text-decoration:none;font-weight:bold;">注册 / 登录后成绩才能入排行榜</a></div>';
    }
  }
  return {register:register,login:login,logout:logout,user:user,record:record,top:top,myBest:myBest,toast:toast,mountChip:mountChip,esc:esc};
})();
