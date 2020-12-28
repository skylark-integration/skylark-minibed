/**
 * skylark-minibed - A version of minibed.js( html/css/js playground) that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-minibed/
 * @license MIT
 */
define([],function(){function t(t){let e=t.split(".");return t=e.shift(),this.el=document.createElement(t),e.forEach(t=>{r(this.el,t)}),this.class=(t=>(r(this.el,t),this)),this.setAttr=((t,e)=>(this.el.setAttribute(t,e),this)),this.html=(t=>(this.el.innerHTML=t,this)),this.dom=(()=>this.el),this.append=(t=>(this.el.appendChild(t),this)),this}const e=function(t){t=t||{};for(let n=1;n<arguments.length;n++){let i=arguments[n];if(i)for(let n in i)i.hasOwnProperty(n)&&(Array.isArray(i[n])?t[n]=i[n]:"object"==typeof i[n]&&null!==i[n]?t[n]=e(t[n],i[n]):t[n]=i[n])}return t};let n=function(){let t=["Webkit","O","Moz","ms"],e={};function n(n){return n=n.replace(/^-ms-/,"ms-").replace(/-([\da-z])/gi,function(t,e){return e.toUpperCase()}),e[n]||(e[n]=function(e){let n=document.body.style;if(e in n)return e;let i,o=t.length,r=e.charAt(0).toUpperCase()+e.slice(1);for(;o--;)if((i=t[o]+r)in n)return i;return e}(n))}function i(t,e,i){e=n(e),t.style[e]=i}return function(t,e){let n,o,r=arguments;if(2===r.length)for(n in e)e.hasOwnProperty(n)&&void 0!==(o=e[n])&&e.hasOwnProperty(n)&&i(t,n,o);else i(t,r[1],r[2])}}();function i(t,e,n,i=!1){e=e.split(" ");for(let o=0;o<e.length;o++)document.addEventListener?t.addEventListener(e[o],n,i):document.attachEvent&&t.attachEvent("on"+e[o],n)}function o(t,e){return("string"==typeof t?t:s(t)).indexOf(" "+e+" ")>=0}function r(t,e){let n=s(t),i=n+e;o(n,e)||(t.className=i.substring(1))}function s(t){return(" "+(t&&t.className||"")+" ").replace(/\s+/gi," ")}return{animationEndEvents:"webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",CreateDOM:t,inArray:function(t,e,n){let i;if(n){for(i in e)if(e.hasOwnProperty(i)&&e[i]===t)return!0}else for(i in e)if(e.hasOwnProperty(i)&&e[i]===t)return!0;return!1},stopPropagation:function(t){void 0!==(t=t||window.event).stopPropagation?t.stopPropagation():t.cancelBubble=!0},deepExtend:e,generateID:function(t=""){let e=`minibed_${t}_`;return e+="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){let e=16*Math.random()|0;return("x"===t?e:3&e|8).toString(16)})},outerHeight:function(t){let e=t.offsetHeight,n=window.getComputedStyle(t);return e+=parseInt(n.marginTop)+parseInt(n.marginBottom)},css:n,addListener:i,hasClass:o,addClass:r,removeClass:function(t,e){let n,i=s(t);o(t,e)&&(n=i.replace(" "+e+" "," "),t.className=n.substring(1,n.length-1))},remove:function(t){t.parentNode&&t.parentNode.removeChild(t)},classList:s,getExtension:function(t){return t.match(/\.([^.]+)$/)[1]},fixHTML:function(t){const e=document.createElement("div");return e.innerHTML=t,e.innerHTML},Request:(t,e,n)=>{const i=new window.XMLHttpRequest;if("withCredentials"in i)i.onreadystatechange=(()=>{4===i.readyState&&(200===i.status||304===i.status?e(i.responseText):setTimeout(n,0))}),i.open("GET",t,!0),i.send();else{const i=new window.XDomainRequest;i.onerror=(()=>{setTimeout(n,0)}),i.ontimeout=(()=>{setTimeout(n,0)}),i.onload=(()=>{e(i.responseText)}),i.open("get",t),i.send()}},isTouchDevice:function(){return"ontouchstart"in window||navigator.maxTouchPoints},MBResizable:function(e,n=(()=>{})){const o=this;this.el=e;const r=new t("div.resizable-handle").el;function s(t){t.preventDefault();try{t=t.touches[0]?t.touches[0]:t}catch(t){}o.startX=t.clientX,o.startY=t.clientY,o.startWidth=parseInt(document.defaultView.getComputedStyle(o.el,null).width,10),o.startHeight=parseInt(document.defaultView.getComputedStyle(o.el,null).height,10),i(window,"mousemove",c,!1),i(window,"mouseup",l,!1),i(window,"touchmove",a,!1),i(window,"touchend",u,!1)}function a(t){c(t.touches[0])}function u(t){0===t.touches.length&&l(t.changedTouches[0])}function c(t){o.el.style.height=o.startHeight+t.clientY-o.startY+"px",n()}function l(){window.removeEventListener("mousemove",c,!1),window.removeEventListener("mouseup",l,!1),window.removeEventListener("touchmove",a,!1),window.removeEventListener("touchend",u,!1)}e.appendChild(r),i(r,"mousedown",s,!1),i(r,"touchstart",s,!1)}}});
//# sourceMappingURL=sourcemaps/utils.js.map
