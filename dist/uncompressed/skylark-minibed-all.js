/**
 * skylark-minibed - A version of minibed.js( html/css/js playground) that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-minibed/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-langx-ns/_attach',[],function(){
    return  function attach(obj1,path,obj2) {
        if (typeof path == "string") {
            path = path.split(".");//[path]
        };
        var length = path.length,
            ns=obj1,
            i=0,
            name = path[i++];

        while (i < length) {
            ns = ns[name] = ns[name] || {};
            name = path[i++];
        }

        return ns[name] = obj2;
    }
});
define('skylark-langx-ns/ns',[
    "./_attach"
], function(_attach) {
    var skylark = {
    	attach : function(path,obj) {
    		return _attach(skylark,path,obj);
    	}
    };
    return skylark;
});

define('skylark-langx-ns/main',[
	"./ns"
],function(skylark){
	return skylark;
});
define('skylark-langx-ns', ['skylark-langx-ns/main'], function (main) { return main; });

define('skylark-langx/skylark',[
    "skylark-langx-ns"
], function(ns) {
	return ns;
});

define('skylark-codemirror/cm',[
	"skylark-langx/skylark"
],function(skylark){

	return skylark.attach("intg.cm", {});
});
define('skylark-codemirror/primitives/util/browser',[],function () {
    'use strict';
    let userAgent = navigator.userAgent;
    let platform = navigator.platform;
    let gecko = /gecko\/\d/i.test(userAgent);
    let ie_upto10 = /MSIE \d/.test(userAgent);
    let ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
    let edge = /Edge\/(\d+)/.exec(userAgent);
    let ie = ie_upto10 || ie_11up || edge;
    let ie_version = ie && (ie_upto10 ? document.documentMode || 6 : +(edge || ie_11up)[1]);
    let webkit = !edge && /WebKit\//.test(userAgent);
    let qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
    let chrome = !edge && /Chrome\//.test(userAgent);
    let presto = /Opera\//.test(userAgent);
    let safari = /Apple Computer/.test(navigator.vendor);
    let mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
    let phantom = /PhantomJS/.test(userAgent);
    let ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
    let android = /Android/.test(userAgent);
    let mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
    let mac = ios || /Mac/.test(platform);
    let chromeOS = /\bCrOS\b/.test(userAgent);
    let windows = /win/i.test(platform);
    let presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
    if (presto_version)
        presto_version = Number(presto_version[1]);
    if (presto_version && presto_version >= 15) {
        presto = false;
        webkit = true;
    }
    let flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
    let captureRightClick = gecko || ie && ie_version >= 9;
    return {
        gecko: gecko,
        ie: ie,
        ie_version: ie_version,
        webkit: webkit,
        chrome: chrome,
        presto: presto,
        safari: safari,
        mac_geMountainLion: mac_geMountainLion,
        phantom: phantom,
        ios: ios,
        android: android,
        mobile: mobile,
        mac: mac,
        chromeOS: chromeOS,
        windows: windows,
        flipCtrlCmd: flipCtrlCmd,
        captureRightClick: captureRightClick
    };
});
define('skylark-codemirror/primitives/util/dom',['./browser'], function (a) {
    'use strict';
    function classTest(cls) {
        return new RegExp('(^|\\s)' + cls + '(?:$|\\s)\\s*');
    }
    let rmClass = function (node, cls) {
        let current = node.className;
        let match = classTest(cls).exec(current);
        if (match) {
            let after = current.slice(match.index + match[0].length);
            node.className = current.slice(0, match.index) + (after ? match[1] + after : '');
        }
    };
    function removeChildren(e) {
        for (let count = e.childNodes.length; count > 0; --count)
            e.removeChild(e.firstChild);
        return e;
    }
    function removeChildrenAndAdd(parent, e) {
        return removeChildren(parent).appendChild(e);
    }
    function elt(tag, content, className, style) {
        let e = document.createElement(tag);
        if (className)
            e.className = className;
        if (style)
            e.style.cssText = style;
        if (typeof content == 'string')
            e.appendChild(document.createTextNode(content));
        else if (content)
            for (let i = 0; i < content.length; ++i)
                e.appendChild(content[i]);
        return e;
    }
    function eltP(tag, content, className, style) {
        let e = elt(tag, content, className, style);
        e.setAttribute('role', 'presentation');
        return e;
    }
    let range;
    if (document.createRange)
        range = function (node, start, end, endNode) {
            let r = document.createRange();
            r.setEnd(endNode || node, end);
            r.setStart(node, start);
            return r;
        };
    else
        range = function (node, start, end) {
            let r = document.body.createTextRange();
            try {
                r.moveToElementText(node.parentNode);
            } catch (e) {
                return r;
            }
            r.collapse(true);
            r.moveEnd('character', end);
            r.moveStart('character', start);
            return r;
        };
    function contains(parent, child) {
        if (child.nodeType == 3)
            child = child.parentNode;
        if (parent.contains)
            return parent.contains(child);
        do {
            if (child.nodeType == 11)
                child = child.host;
            if (child == parent)
                return true;
        } while (child = child.parentNode);
    }
    function activeElt() {
        let activeElement;
        try {
            activeElement = document.activeElement;
        } catch (e) {
            activeElement = document.body || null;
        }
        while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement)
            activeElement = activeElement.shadowRoot.activeElement;
        return activeElement;
    }
    function addClass(node, cls) {
        let current = node.className;
        if (!classTest(cls).test(current))
            node.className += (current ? ' ' : '') + cls;
    }
    function joinClasses(a, b) {
        let as = a.split(' ');
        for (let i = 0; i < as.length; i++)
            if (as[i] && !classTest(as[i]).test(b))
                b += ' ' + as[i];
        return b;
    }
    let selectInput = function (node) {
        node.select();
    };
    if (a.ios)
        selectInput = function (node) {
            node.selectionStart = 0;
            node.selectionEnd = node.value.length;
        };
    else if (a.ie)
        selectInput = function (node) {
            try {
                node.select();
            } catch (_e) {
            }
        };
    return {
        classTest: classTest,
        rmClass: rmClass,
        removeChildren: removeChildren,
        removeChildrenAndAdd: removeChildrenAndAdd,
        elt: elt,
        eltP: eltP,
        range: range,
        contains: contains,
        activeElt: activeElt,
        addClass: addClass,
        joinClasses: joinClasses,
        selectInput: selectInput
    };
});
define('skylark-codemirror/primitives/util/misc',[],function () {
    'use strict';
    function bind(f) {
        let args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return f.apply(null, args);
        };
    }
    function copyObj(obj, target, overwrite) {
        if (!target)
            target = {};
        for (let prop in obj)
            if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
                target[prop] = obj[prop];
        return target;
    }
    function countColumn(string, end, tabSize, startIndex, startValue) {
        if (end == null) {
            end = string.search(/[^\s\u00a0]/);
            if (end == -1)
                end = string.length;
        }
        for (let i = startIndex || 0, n = startValue || 0;;) {
            let nextTab = string.indexOf('\t', i);
            if (nextTab < 0 || nextTab >= end)
                return n + (end - i);
            n += nextTab - i;
            n += tabSize - n % tabSize;
            i = nextTab + 1;
        }
    }
    class Delayed {
        constructor() {
            this.id = null;
        }
        set(ms, f) {
            clearTimeout(this.id);
            this.id = setTimeout(f, ms);
        }
    }
    function indexOf(array, elt) {
        for (let i = 0; i < array.length; ++i)
            if (array[i] == elt)
                return i;
        return -1;
    }
    let scrollerGap = 30;
    let Pass = {
        toString: function () {
            return 'CodeMirror.Pass';
        }
    };
    let sel_dontScroll = { scroll: false }, sel_mouse = { origin: '*mouse' }, sel_move = { origin: '+move' };
    function findColumn(string, goal, tabSize) {
        for (let pos = 0, col = 0;;) {
            let nextTab = string.indexOf('\t', pos);
            if (nextTab == -1)
                nextTab = string.length;
            let skipped = nextTab - pos;
            if (nextTab == string.length || col + skipped >= goal)
                return pos + Math.min(skipped, goal - col);
            col += nextTab - pos;
            col += tabSize - col % tabSize;
            pos = nextTab + 1;
            if (col >= goal)
                return pos;
        }
    }
    let spaceStrs = [''];
    function spaceStr(n) {
        while (spaceStrs.length <= n)
            spaceStrs.push(lst(spaceStrs) + ' ');
        return spaceStrs[n];
    }
    function lst(arr) {
        return arr[arr.length - 1];
    }
    function map(array, f) {
        let out = [];
        for (let i = 0; i < array.length; i++)
            out[i] = f(array[i], i);
        return out;
    }
    function insertSorted(array, value, score) {
        let pos = 0, priority = score(value);
        while (pos < array.length && score(array[pos]) <= priority)
            pos++;
        array.splice(pos, 0, value);
    }
    function nothing() {
    }
    function createObj(base, props) {
        let inst;
        if (Object.create) {
            inst = Object.create(base);
        } else {
            nothing.prototype = base;
            inst = new nothing();
        }
        if (props)
            copyObj(props, inst);
        return inst;
    }
    let nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
    function isWordCharBasic(ch) {
        return /\w/.test(ch) || ch > '\x80' && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
    }
    function isWordChar(ch, helper) {
        if (!helper)
            return isWordCharBasic(ch);
        if (helper.source.indexOf('\\w') > -1 && isWordCharBasic(ch))
            return true;
        return helper.test(ch);
    }
    function isEmpty(obj) {
        for (let n in obj)
            if (obj.hasOwnProperty(n) && obj[n])
                return false;
        return true;
    }
    let extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
    function isExtendingChar(ch) {
        return ch.charCodeAt(0) >= 768 && extendingChars.test(ch);
    }
    function skipExtendingChars(str, pos, dir) {
        while ((dir < 0 ? pos > 0 : pos < str.length) && isExtendingChar(str.charAt(pos)))
            pos += dir;
        return pos;
    }
    function findFirst(pred, from, to) {
        let dir = from > to ? -1 : 1;
        for (;;) {
            if (from == to)
                return from;
            let midF = (from + to) / 2, mid = dir < 0 ? Math.ceil(midF) : Math.floor(midF);
            if (mid == from)
                return pred(mid) ? from : to;
            if (pred(mid))
                to = mid;
            else
                from = mid + dir;
        }
    }
    return {
        bind: bind,
        copyObj: copyObj,
        countColumn: countColumn,
        Delayed: Delayed,
        indexOf: indexOf,
        scrollerGap: scrollerGap,
        Pass: Pass,
        sel_dontScroll: sel_dontScroll,
        sel_mouse: sel_mouse,
        sel_move: sel_move,
        findColumn: findColumn,
        spaceStr: spaceStr,
        lst: lst,
        map: map,
        insertSorted: insertSorted,
        createObj: createObj,
        isWordCharBasic: isWordCharBasic,
        isWordChar: isWordChar,
        isEmpty: isEmpty,
        isExtendingChar: isExtendingChar,
        skipExtendingChars: skipExtendingChars,
        findFirst: findFirst
    };
});
define('skylark-codemirror/primitives/display/Display',[
    '../util/browser',
    '../util/dom',
    '../util/misc'
], function (browser, dom, misc) {
    'use strict';
    function Display(place, doc, input) {
        let d = this;
        this.input = input;
        d.scrollbarFiller = dom.elt('div', null, 'CodeMirror-scrollbar-filler');
        d.scrollbarFiller.setAttribute('cm-not-content', 'true');
        d.gutterFiller = dom.elt('div', null, 'CodeMirror-gutter-filler');
        d.gutterFiller.setAttribute('cm-not-content', 'true');
        d.lineDiv = dom.eltP('div', null, 'CodeMirror-code');
        d.selectionDiv = dom.elt('div', null, null, 'position: relative; z-index: 1');
        d.cursorDiv = dom.elt('div', null, 'CodeMirror-cursors');
        d.measure = dom.elt('div', null, 'CodeMirror-measure');
        d.lineMeasure = dom.elt('div', null, 'CodeMirror-measure');
        d.lineSpace = dom.eltP('div', [
            d.measure,
            d.lineMeasure,
            d.selectionDiv,
            d.cursorDiv,
            d.lineDiv
        ], null, 'position: relative; outline: none');
        let lines = dom.eltP('div', [d.lineSpace], 'CodeMirror-lines');
        d.mover = dom.elt('div', [lines], null, 'position: relative');
        d.sizer = dom.elt('div', [d.mover], 'CodeMirror-sizer');
        d.sizerWidth = null;
        d.heightForcer = dom.elt('div', null, null, 'position: absolute; height: ' + misc.scrollerGap + 'px; width: 1px;');
        d.gutters = dom.elt('div', null, 'CodeMirror-gutters');
        d.lineGutter = null;
        d.scroller = dom.elt('div', [
            d.sizer,
            d.heightForcer,
            d.gutters
        ], 'CodeMirror-scroll');
        d.scroller.setAttribute('tabIndex', '-1');
        d.wrapper = dom.elt('div', [
            d.scrollbarFiller,
            d.gutterFiller,
            d.scroller
        ], 'CodeMirror');
        if (browser.ie && browser.ie_version < 8) {
            d.gutters.style.zIndex = -1;
            d.scroller.style.paddingRight = 0;
        }
        if (!browser.webkit && !(browser.gecko && browser.mobile))
            d.scroller.draggable = true;
        if (place) {
            if (place.appendChild)
                place.appendChild(d.wrapper);
            else
                place(d.wrapper);
        }
        d.viewFrom = d.viewTo = doc.first;
        d.reportedViewFrom = d.reportedViewTo = doc.first;
        d.view = [];
        d.renderedView = null;
        d.externalMeasured = null;
        d.viewOffset = 0;
        d.lastWrapHeight = d.lastWrapWidth = 0;
        d.updateLineNumbers = null;
        d.nativeBarWidth = d.barHeight = d.barWidth = 0;
        d.scrollbarsClipped = false;
        d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
        d.alignWidgets = false;
        d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
        d.maxLine = null;
        d.maxLineLength = 0;
        d.maxLineChanged = false;
        d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;
        d.shift = false;
        d.selForContextMenu = null;
        d.activeTouch = null;
        input.init(d);
    }
    return { Display: Display };
});
define('skylark-codemirror/primitives/line/utils_line',['../util/misc'], function (a) {
    'use strict';
    function getLine(doc, n) {
        n -= doc.first;
        if (n < 0 || n >= doc.size)
            throw new Error('There is no line ' + (n + doc.first) + ' in the document.');
        let chunk = doc;
        while (!chunk.lines) {
            for (let i = 0;; ++i) {
                let child = chunk.children[i], sz = child.chunkSize();
                if (n < sz) {
                    chunk = child;
                    break;
                }
                n -= sz;
            }
        }
        return chunk.lines[n];
    }
    function getBetween(doc, start, end) {
        let out = [], n = start.line;
        doc.iter(start.line, end.line + 1, line => {
            let text = line.text;
            if (n == end.line)
                text = text.slice(0, end.ch);
            if (n == start.line)
                text = text.slice(start.ch);
            out.push(text);
            ++n;
        });
        return out;
    }
    function getLines(doc, from, to) {
        let out = [];
        doc.iter(from, to, line => {
            out.push(line.text);
        });
        return out;
    }
    function updateLineHeight(line, height) {
        let diff = height - line.height;
        if (diff)
            for (let n = line; n; n = n.parent)
                n.height += diff;
    }
    function lineNo(line) {
        if (line.parent == null)
            return null;
        let cur = line.parent, no = a.indexOf(cur.lines, line);
        for (let chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
            for (let i = 0;; ++i) {
                if (chunk.children[i] == cur)
                    break;
                no += chunk.children[i].chunkSize();
            }
        }
        return no + cur.first;
    }
    function lineAtHeight(chunk, h) {
        let n = chunk.first;
        outer:
            do {
                for (let i = 0; i < chunk.children.length; ++i) {
                    let child = chunk.children[i], ch = child.height;
                    if (h < ch) {
                        chunk = child;
                        continue outer;
                    }
                    h -= ch;
                    n += child.chunkSize();
                }
                return n;
            } while (!chunk.lines);
        let i = 0;
        for (; i < chunk.lines.length; ++i) {
            let line = chunk.lines[i], lh = line.height;
            if (h < lh)
                break;
            h -= lh;
        }
        return n + i;
    }
    function isLine(doc, l) {
        return l >= doc.first && l < doc.first + doc.size;
    }
    function lineNumberFor(options, i) {
        return String(options.lineNumberFormatter(i + options.firstLineNumber));
    }
    return {
        getLine: getLine,
        getBetween: getBetween,
        getLines: getLines,
        updateLineHeight: updateLineHeight,
        lineNo: lineNo,
        lineAtHeight: lineAtHeight,
        isLine: isLine,
        lineNumberFor: lineNumberFor
    };
});
define('skylark-codemirror/primitives/line/pos',['./utils_line'], function (utils_line) {
    'use strict';
    function Pos(line, ch, sticky = null) {
        if (!(this instanceof Pos))
            return new Pos(line, ch, sticky);
        this.line = line;
        this.ch = ch;
        this.sticky = sticky;
    }
    function cmp(a, b) {
        return a.line - b.line || a.ch - b.ch;
    }
    function equalCursorPos(a, b) {
        return a.sticky == b.sticky && cmp(a, b) == 0;
    }
    function copyPos(x) {
        return Pos(x.line, x.ch);
    }
    function maxPos(a, b) {
        return cmp(a, b) < 0 ? b : a;
    }
    function minPos(a, b) {
        return cmp(a, b) < 0 ? a : b;
    }
    function clipLine(doc, n) {
        return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));
    }
    function clipPos(doc, pos) {
        if (pos.line < doc.first)
            return Pos(doc.first, 0);
        let last = doc.first + doc.size - 1;
        if (pos.line > last)
            return Pos(last, utils_line.getLine(doc, last).text.length);
        return clipToLen(pos, utils_line.getLine(doc, pos.line).text.length);
    }
    function clipToLen(pos, linelen) {
        let ch = pos.ch;
        if (ch == null || ch > linelen)
            return Pos(pos.line, linelen);
        else if (ch < 0)
            return Pos(pos.line, 0);
        else
            return pos;
    }
    function clipPosArray(doc, array) {
        let out = [];
        for (let i = 0; i < array.length; i++)
            out[i] = clipPos(doc, array[i]);
        return out;
    }
    return {
        Pos: Pos,
        cmp: cmp,
        equalCursorPos: equalCursorPos,
        copyPos: copyPos,
        maxPos: maxPos,
        minPos: minPos,
        clipLine: clipLine,
        clipPos: clipPos,
        clipPosArray: clipPosArray
    };
});
define('skylark-codemirror/primitives/line/saw_special_spans',[],function () {
    'use strict';
    let sawReadOnlySpans = false, sawCollapsedSpans = false;
    function seeReadOnlySpans() {
        sawReadOnlySpans = true;
    }
    function seeCollapsedSpans() {
        sawCollapsedSpans = true;
    }
    return {
        sawReadOnlySpans: sawReadOnlySpans,
        sawCollapsedSpans: sawCollapsedSpans,
        seeReadOnlySpans: seeReadOnlySpans,
        seeCollapsedSpans: seeCollapsedSpans
    };
});
define('skylark-codemirror/primitives/line/spans',[
    '../util/misc',
    './pos',
    './saw_special_spans',
    './utils_line'
], function (misc, pos, saw_special_spans, utils_line) {
    'use strict';
    function MarkedSpan(marker, from, to) {
        this.marker = marker;
        this.from = from;
        this.to = to;
    }
    function getMarkedSpanFor(spans, marker) {
        if (spans)
            for (let i = 0; i < spans.length; ++i) {
                let span = spans[i];
                if (span.marker == marker)
                    return span;
            }
    }
    function removeMarkedSpan(spans, span) {
        let r;
        for (let i = 0; i < spans.length; ++i)
            if (spans[i] != span)
                (r || (r = [])).push(spans[i]);
        return r;
    }
    function addMarkedSpan(line, span) {
        line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
        span.marker.attachLine(line);
    }
    function markedSpansBefore(old, startCh, isInsert) {
        let nw;
        if (old)
            for (let i = 0; i < old.length; ++i) {
                let span = old[i], marker = span.marker;
                let startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
                if (startsBefore || span.from == startCh && marker.type == 'bookmark' && (!isInsert || !span.marker.insertLeft)) {
                    let endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);
                    (nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
                }
            }
        return nw;
    }
    function markedSpansAfter(old, endCh, isInsert) {
        let nw;
        if (old)
            for (let i = 0; i < old.length; ++i) {
                let span = old[i], marker = span.marker;
                let endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
                if (endsAfter || span.from == endCh && marker.type == 'bookmark' && (!isInsert || span.marker.insertLeft)) {
                    let startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);
                    (nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh, span.to == null ? null : span.to - endCh));
                }
            }
        return nw;
    }
    function stretchSpansOverChange(doc, change) {
        if (change.full)
            return null;
        let oldFirst = utils_line.isLine(doc, change.from.line) && utils_line.getLine(doc, change.from.line).markedSpans;
        let oldLast = utils_line.isLine(doc, change.to.line) && utils_line.getLine(doc, change.to.line).markedSpans;
        if (!oldFirst && !oldLast)
            return null;
        let startCh = change.from.ch, endCh = change.to.ch, isInsert = pos.cmp(change.from, change.to) == 0;
        let first = markedSpansBefore(oldFirst, startCh, isInsert);
        let last = markedSpansAfter(oldLast, endCh, isInsert);
        let sameLine = change.text.length == 1, offset = misc.lst(change.text).length + (sameLine ? startCh : 0);
        if (first) {
            for (let i = 0; i < first.length; ++i) {
                let span = first[i];
                if (span.to == null) {
                    let found = getMarkedSpanFor(last, span.marker);
                    if (!found)
                        span.to = startCh;
                    else if (sameLine)
                        span.to = found.to == null ? null : found.to + offset;
                }
            }
        }
        if (last) {
            for (let i = 0; i < last.length; ++i) {
                let span = last[i];
                if (span.to != null)
                    span.to += offset;
                if (span.from == null) {
                    let found = getMarkedSpanFor(first, span.marker);
                    if (!found) {
                        span.from = offset;
                        if (sameLine)
                            (first || (first = [])).push(span);
                    }
                } else {
                    span.from += offset;
                    if (sameLine)
                        (first || (first = [])).push(span);
                }
            }
        }
        if (first)
            first = clearEmptySpans(first);
        if (last && last != first)
            last = clearEmptySpans(last);
        let newMarkers = [first];
        if (!sameLine) {
            let gap = change.text.length - 2, gapMarkers;
            if (gap > 0 && first)
                for (let i = 0; i < first.length; ++i)
                    if (first[i].to == null)
                        (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i].marker, null, null));
            for (let i = 0; i < gap; ++i)
                newMarkers.push(gapMarkers);
            newMarkers.push(last);
        }
        return newMarkers;
    }
    function clearEmptySpans(spans) {
        for (let i = 0; i < spans.length; ++i) {
            let span = spans[i];
            if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
                spans.splice(i--, 1);
        }
        if (!spans.length)
            return null;
        return spans;
    }
    function removeReadOnlyRanges(doc, from, to) {
        let markers = null;
        doc.iter(from.line, to.line + 1, line => {
            if (line.markedSpans)
                for (let i = 0; i < line.markedSpans.length; ++i) {
                    let mark = line.markedSpans[i].marker;
                    if (mark.readOnly && (!markers || misc.indexOf(markers, mark) == -1))
                        (markers || (markers = [])).push(mark);
                }
        });
        if (!markers)
            return null;
        let parts = [{
                from: from,
                to: to
            }];
        for (let i = 0; i < markers.length; ++i) {
            let mk = markers[i], m = mk.find(0);
            for (let j = 0; j < parts.length; ++j) {
                let p = parts[j];
                if (pos.cmp(p.to, m.from) < 0 || pos.cmp(p.from, m.to) > 0)
                    continue;
                let newParts = [
                        j,
                        1
                    ], dfrom = pos.cmp(p.from, m.from), dto = pos.cmp(p.to, m.to);
                if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
                    newParts.push({
                        from: p.from,
                        to: m.from
                    });
                if (dto > 0 || !mk.inclusiveRight && !dto)
                    newParts.push({
                        from: m.to,
                        to: p.to
                    });
                parts.splice.apply(parts, newParts);
                j += newParts.length - 3;
            }
        }
        return parts;
    }
    function detachMarkedSpans(line) {
        let spans = line.markedSpans;
        if (!spans)
            return;
        for (let i = 0; i < spans.length; ++i)
            spans[i].marker.detachLine(line);
        line.markedSpans = null;
    }
    function attachMarkedSpans(line, spans) {
        if (!spans)
            return;
        for (let i = 0; i < spans.length; ++i)
            spans[i].marker.attachLine(line);
        line.markedSpans = spans;
    }
    function extraLeft(marker) {
        return marker.inclusiveLeft ? -1 : 0;
    }
    function extraRight(marker) {
        return marker.inclusiveRight ? 1 : 0;
    }
    function compareCollapsedMarkers(a, b) {
        let lenDiff = a.lines.length - b.lines.length;
        if (lenDiff != 0)
            return lenDiff;
        let aPos = a.find(), bPos = b.find();
        let fromCmp = pos.cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
        if (fromCmp)
            return -fromCmp;
        let toCmp = pos.cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
        if (toCmp)
            return toCmp;
        return b.id - a.id;
    }
    function collapsedSpanAtSide(line, start) {
        let sps = saw_special_spans.sawCollapsedSpans && line.markedSpans, found;
        if (sps)
            for (let sp, i = 0; i < sps.length; ++i) {
                sp = sps[i];
                if (sp.marker.collapsed && (start ? sp.from : sp.to) == null && (!found || compareCollapsedMarkers(found, sp.marker) < 0))
                    found = sp.marker;
            }
        return found;
    }
    function collapsedSpanAtStart(line) {
        return collapsedSpanAtSide(line, true);
    }
    function collapsedSpanAtEnd(line) {
        return collapsedSpanAtSide(line, false);
    }
    function collapsedSpanAround(line, ch) {
        let sps = saw_special_spans.sawCollapsedSpans && line.markedSpans, found;
        if (sps)
            for (let i = 0; i < sps.length; ++i) {
                let sp = sps[i];
                if (sp.marker.collapsed && (sp.from == null || sp.from < ch) && (sp.to == null || sp.to > ch) && (!found || compareCollapsedMarkers(found, sp.marker) < 0))
                    found = sp.marker;
            }
        return found;
    }
    function conflictingCollapsedRange(doc, lineNo, from, to, marker) {
        let line = utils_line.getLine(doc, utils_line.lineNo);
        let sps = saw_special_spans.sawCollapsedSpans && line.markedSpans;
        if (sps)
            for (let i = 0; i < sps.length; ++i) {
                let sp = sps[i];
                if (!sp.marker.collapsed)
                    continue;
                let found = sp.marker.find(0);
                let fromCmp = pos.cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
                let toCmp = pos.cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
                if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0)
                    continue;
                if (fromCmp <= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? pos.cmp(found.to, from) >= 0 : pos.cmp(found.to, from) > 0) || fromCmp >= 0 && (sp.marker.inclusiveRight && marker.inclusiveLeft ? pos.cmp(found.from, to) <= 0 : pos.cmp(found.from, to) < 0))
                    return true;
            }
    }
    function visualLine(line) {
        let merged;
        while (merged = collapsedSpanAtStart(line))
            line = merged.find(-1, true).line;
        return line;
    }
    function visualLineEnd(line) {
        let merged;
        while (merged = collapsedSpanAtEnd(line))
            line = merged.find(1, true).line;
        return line;
    }
    function visualLineContinued(line) {
        let merged, lines;
        while (merged = collapsedSpanAtEnd(line)) {
            line = merged.find(1, true).line;
            (lines || (lines = [])).push(line);
        }
        return lines;
    }
    function visualLineNo(doc, lineN) {
        let line = utils_line.getLine(doc, lineN), vis = visualLine(line);
        if (line == vis)
            return lineN;
        return utils_line.lineNo(vis);
    }
    function visualLineEndNo(doc, lineN) {
        if (lineN > doc.lastLine())
            return lineN;
        let line = utils_line.getLine(doc, lineN), merged;
        if (!lineIsHidden(doc, line))
            return lineN;
        while (merged = collapsedSpanAtEnd(line))
            line = merged.find(1, true).line;
        return utils_line.lineNo(line) + 1;
    }
    function lineIsHidden(doc, line) {
        let sps = saw_special_spans.sawCollapsedSpans && line.markedSpans;
        if (sps)
            for (let sp, i = 0; i < sps.length; ++i) {
                sp = sps[i];
                if (!sp.marker.collapsed)
                    continue;
                if (sp.from == null)
                    return true;
                if (sp.marker.widgetNode)
                    continue;
                if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
                    return true;
            }
    }
    function lineIsHiddenInner(doc, line, span) {
        if (span.to == null) {
            let end = span.marker.find(1, true);
            return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker));
        }
        if (span.marker.inclusiveRight && span.to == line.text.length)
            return true;
        for (let sp, i = 0; i < line.markedSpans.length; ++i) {
            sp = line.markedSpans[i];
            if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to && (sp.to == null || sp.to != span.from) && (sp.marker.inclusiveLeft || span.marker.inclusiveRight) && lineIsHiddenInner(doc, line, sp))
                return true;
        }
    }
    function heightAtLine(lineObj) {
        lineObj = visualLine(lineObj);
        let h = 0, chunk = lineObj.parent;
        for (let i = 0; i < chunk.lines.length; ++i) {
            let line = chunk.lines[i];
            if (line == lineObj)
                break;
            else
                h += line.height;
        }
        for (let p = chunk.parent; p; chunk = p, p = chunk.parent) {
            for (let i = 0; i < p.children.length; ++i) {
                let cur = p.children[i];
                if (cur == chunk)
                    break;
                else
                    h += cur.height;
            }
        }
        return h;
    }
    function lineLength(line) {
        if (line.height == 0)
            return 0;
        let len = line.text.length, merged, cur = line;
        while (merged = collapsedSpanAtStart(cur)) {
            let found = merged.find(0, true);
            cur = found.from.line;
            len += found.from.ch - found.to.ch;
        }
        cur = line;
        while (merged = collapsedSpanAtEnd(cur)) {
            let found = merged.find(0, true);
            len -= cur.text.length - found.from.ch;
            cur = found.to.line;
            len += cur.text.length - found.to.ch;
        }
        return len;
    }
    function findMaxLine(cm) {
        let d = cm.display, doc = cm.doc;
        d.maxLine = utils_line.getLine(doc, doc.first);
        d.maxLineLength = lineLength(d.maxLine);
        d.maxLineChanged = true;
        doc.iter(line => {
            let len = lineLength(line);
            if (len > d.maxLineLength) {
                d.maxLineLength = len;
                d.maxLine = line;
            }
        });
    }
    return {
        MarkedSpan: MarkedSpan,
        getMarkedSpanFor: getMarkedSpanFor,
        removeMarkedSpan: removeMarkedSpan,
        addMarkedSpan: addMarkedSpan,
        stretchSpansOverChange: stretchSpansOverChange,
        removeReadOnlyRanges: removeReadOnlyRanges,
        detachMarkedSpans: detachMarkedSpans,
        attachMarkedSpans: attachMarkedSpans,
        compareCollapsedMarkers: compareCollapsedMarkers,
        collapsedSpanAtStart: collapsedSpanAtStart,
        collapsedSpanAtEnd: collapsedSpanAtEnd,
        collapsedSpanAround: collapsedSpanAround,
        conflictingCollapsedRange: conflictingCollapsedRange,
        visualLine: visualLine,
        visualLineEnd: visualLineEnd,
        visualLineContinued: visualLineContinued,
        visualLineNo: visualLineNo,
        visualLineEndNo: visualLineEndNo,
        lineIsHidden: lineIsHidden,
        heightAtLine: heightAtLine,
        lineLength: lineLength,
        findMaxLine: findMaxLine
    };
});
define('skylark-codemirror/primitives/util/bidi',['./misc'], function (a) {
    'use strict';
    function iterateBidiSections(order, from, to, f) {
        if (!order)
            return f(from, to, 'ltr', 0);
        let found = false;
        for (let i = 0; i < order.length; ++i) {
            let part = order[i];
            if (part.from < to && part.to > from || from == to && part.to == from) {
                f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? 'rtl' : 'ltr', i);
                found = true;
            }
        }
        if (!found)
            f(from, to, 'ltr');
    }
    let bidiOther = null;
    function getBidiPartAt(order, ch, sticky) {
        let found;
        bidiOther = null;
        for (let i = 0; i < order.length; ++i) {
            let cur = order[i];
            if (cur.from < ch && cur.to > ch)
                return i;
            if (cur.to == ch) {
                if (cur.from != cur.to && sticky == 'before')
                    found = i;
                else
                    bidiOther = i;
            }
            if (cur.from == ch) {
                if (cur.from != cur.to && sticky != 'before')
                    found = i;
                else
                    bidiOther = i;
            }
        }
        return found != null ? found : bidiOther;
    }
    let bidiOrdering = function () {
        let lowTypes = 'bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN';
        let arabicTypes = 'nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111';
        function charType(code) {
            if (code <= 247)
                return lowTypes.charAt(code);
            else if (1424 <= code && code <= 1524)
                return 'R';
            else if (1536 <= code && code <= 1785)
                return arabicTypes.charAt(code - 1536);
            else if (1774 <= code && code <= 2220)
                return 'r';
            else if (8192 <= code && code <= 8203)
                return 'w';
            else if (code == 8204)
                return 'b';
            else
                return 'L';
        }
        let bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
        let isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;
        function BidiSpan(level, from, to) {
            this.level = level;
            this.from = from;
            this.to = to;
        }
        return function (str, direction) {
            let outerType = direction == 'ltr' ? 'L' : 'R';
            if (str.length == 0 || direction == 'ltr' && !bidiRE.test(str))
                return false;
            let len = str.length, types = [];
            for (let i = 0; i < len; ++i)
                types.push(charType(str.charCodeAt(i)));
            for (let i = 0, prev = outerType; i < len; ++i) {
                let type = types[i];
                if (type == 'm')
                    types[i] = prev;
                else
                    prev = type;
            }
            for (let i = 0, cur = outerType; i < len; ++i) {
                let type = types[i];
                if (type == '1' && cur == 'r')
                    types[i] = 'n';
                else if (isStrong.test(type)) {
                    cur = type;
                    if (type == 'r')
                        types[i] = 'R';
                }
            }
            for (let i = 1, prev = types[0]; i < len - 1; ++i) {
                let type = types[i];
                if (type == '+' && prev == '1' && types[i + 1] == '1')
                    types[i] = '1';
                else if (type == ',' && prev == types[i + 1] && (prev == '1' || prev == 'n'))
                    types[i] = prev;
                prev = type;
            }
            for (let i = 0; i < len; ++i) {
                let type = types[i];
                if (type == ',')
                    types[i] = 'N';
                else if (type == '%') {
                    let end;
                    for (end = i + 1; end < len && types[end] == '%'; ++end) {
                    }
                    let replace = i && types[i - 1] == '!' || end < len && types[end] == '1' ? '1' : 'N';
                    for (let j = i; j < end; ++j)
                        types[j] = replace;
                    i = end - 1;
                }
            }
            for (let i = 0, cur = outerType; i < len; ++i) {
                let type = types[i];
                if (cur == 'L' && type == '1')
                    types[i] = 'L';
                else if (isStrong.test(type))
                    cur = type;
            }
            for (let i = 0; i < len; ++i) {
                if (isNeutral.test(types[i])) {
                    let end;
                    for (end = i + 1; end < len && isNeutral.test(types[end]); ++end) {
                    }
                    let before = (i ? types[i - 1] : outerType) == 'L';
                    let after = (end < len ? types[end] : outerType) == 'L';
                    let replace = before == after ? before ? 'L' : 'R' : outerType;
                    for (let j = i; j < end; ++j)
                        types[j] = replace;
                    i = end - 1;
                }
            }
            let order = [], m;
            for (let i = 0; i < len;) {
                if (countsAsLeft.test(types[i])) {
                    let start = i;
                    for (++i; i < len && countsAsLeft.test(types[i]); ++i) {
                    }
                    order.push(new BidiSpan(0, start, i));
                } else {
                    let pos = i, at = order.length;
                    for (++i; i < len && types[i] != 'L'; ++i) {
                    }
                    for (let j = pos; j < i;) {
                        if (countsAsNum.test(types[j])) {
                            if (pos < j)
                                order.splice(at, 0, new BidiSpan(1, pos, j));
                            let nstart = j;
                            for (++j; j < i && countsAsNum.test(types[j]); ++j) {
                            }
                            order.splice(at, 0, new BidiSpan(2, nstart, j));
                            pos = j;
                        } else
                            ++j;
                    }
                    if (pos < i)
                        order.splice(at, 0, new BidiSpan(1, pos, i));
                }
            }
            if (direction == 'ltr') {
                if (order[0].level == 1 && (m = str.match(/^\s+/))) {
                    order[0].from = m[0].length;
                    order.unshift(new BidiSpan(0, 0, m[0].length));
                }
                if (a.lst(order).level == 1 && (m = str.match(/\s+$/))) {
                    a.lst(order).to -= m[0].length;
                    order.push(new BidiSpan(0, len - m[0].length, len));
                }
            }
            return direction == 'rtl' ? order.reverse() : order;
        };
    }();
    function getOrder(line, direction) {
        let order = line.order;
        if (order == null)
            order = line.order = bidiOrdering(line.text, direction);
        return order;
    }
    return {
        iterateBidiSections: iterateBidiSections,
        bidiOther: bidiOther,
        getBidiPartAt: getBidiPartAt,
        getOrder: getOrder
    };
});
define('skylark-codemirror/primitives/util/event',[
    './browser',
    './misc'
], function (a, b) {
    'use strict';
    const noHandlers = [];
    let on = function (emitter, type, f) {
        if (emitter.addEventListener) {
            emitter.addEventListener(type, f, false);
        } else if (emitter.attachEvent) {
            emitter.attachEvent('on' + type, f);
        } else {
            let map = emitter._handlers || (emitter._handlers = {});
            map[type] = (map[type] || noHandlers).concat(f);
        }
    };
    function getHandlers(emitter, type) {
        return emitter._handlers && emitter._handlers[type] || noHandlers;
    }
    function off(emitter, type, f) {
        if (emitter.removeEventListener) {
            emitter.removeEventListener(type, f, false);
        } else if (emitter.detachEvent) {
            emitter.detachEvent('on' + type, f);
        } else {
            let map = emitter._handlers, arr = map && map[type];
            if (arr) {
                let index = b.indexOf(arr, f);
                if (index > -1)
                    map[type] = arr.slice(0, index).concat(arr.slice(index + 1));
            }
        }
    }
    function signal(emitter, type) {
        let handlers = getHandlers(emitter, type);
        if (!handlers.length)
            return;
        let args = Array.prototype.slice.call(arguments, 2);
        for (let i = 0; i < handlers.length; ++i)
            handlers[i].apply(null, args);
    }
    function signalDOMEvent(cm, e, override) {
        if (typeof e == 'string')
            e = {
                type: e,
                preventDefault: function () {
                    this.defaultPrevented = true;
                }
            };
        signal(cm, override || e.type, cm, e);
        return e_defaultPrevented(e) || e.codemirrorIgnore;
    }
    function signalCursorActivity(cm) {
        let arr = cm._handlers && cm._handlers.cursorActivity;
        if (!arr)
            return;
        let set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
        for (let i = 0; i < arr.length; ++i)
            if (b.indexOf(set, arr[i]) == -1)
                set.push(arr[i]);
    }
    function hasHandler(emitter, type) {
        return getHandlers(emitter, type).length > 0;
    }
    function eventMixin(ctor) {
        ctor.prototype.on = function (type, f) {
            on(this, type, f);
        };
        ctor.prototype.off = function (type, f) {
            off(this, type, f);
        };
    }
    function e_preventDefault(e) {
        if (e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;
    }
    function e_stopPropagation(e) {
        if (e.stopPropagation)
            e.stopPropagation();
        else
            e.cancelBubble = true;
    }
    function e_defaultPrevented(e) {
        return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false;
    }
    function e_stop(e) {
        e_preventDefault(e);
        e_stopPropagation(e);
    }
    function e_target(e) {
        return e.target || e.srcElement;
    }
    function e_button(e) {
        let b = e.which;
        if (b == null) {
            if (e.button & 1)
                b = 1;
            else if (e.button & 2)
                b = 3;
            else if (e.button & 4)
                b = 2;
        }
        if (a.mac && e.ctrlKey && b == 1)
            b = 3;
        return b;
    }
    return {
        on: on,
        getHandlers: getHandlers,
        off: off,
        signal: signal,
        signalDOMEvent: signalDOMEvent,
        signalCursorActivity: signalCursorActivity,
        hasHandler: hasHandler,
        eventMixin: eventMixin,
        e_preventDefault: e_preventDefault,
        e_stopPropagation: e_stopPropagation,
        e_defaultPrevented: e_defaultPrevented,
        e_stop: e_stop,
        e_target: e_target,
        e_button: e_button
    };
});
define('skylark-codemirror/primitives/util/feature_detection',[
    './dom',
    './browser'
], function (a, b) {
    'use strict';
    let dragAndDrop = function () {
        if (b.ie && b.ie_version < 9)
            return false;
        let div = a.elt('div');
        return 'draggable' in div || 'dragDrop' in div;
    }();
    let zwspSupported;
    function zeroWidthElement(measure) {
        if (zwspSupported == null) {
            let test = a.elt('span', '\u200B');
            a.removeChildrenAndAdd(measure, a.elt('span', [
                test,
                document.createTextNode('x')
            ]));
            if (measure.firstChild.offsetHeight != 0)
                zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(b.ie && b.ie_version < 8);
        }
        let node = zwspSupported ? a.elt('span', '\u200B') : a.elt('span', '\xA0', null, 'display: inline-block; width: 1px; margin-right: -1px');
        node.setAttribute('cm-text', '');
        return node;
    }
    let badBidiRects;
    function hasBadBidiRects(measure) {
        if (badBidiRects != null)
            return badBidiRects;
        let txt = a.removeChildrenAndAdd(measure, document.createTextNode('AخA'));
        let r0 = a.range(txt, 0, 1).getBoundingClientRect();
        let r1 = a.range(txt, 1, 2).getBoundingClientRect();
        a.removeChildren(measure);
        if (!r0 || r0.left == r0.right)
            return false;
        return badBidiRects = r1.right - r0.right < 3;
    }
    let splitLinesAuto = '\n\nb'.split(/\n/).length != 3 ? string => {
        let pos = 0, result = [], l = string.length;
        while (pos <= l) {
            let nl = string.indexOf('\n', pos);
            if (nl == -1)
                nl = string.length;
            let line = string.slice(pos, string.charAt(nl - 1) == '\r' ? nl - 1 : nl);
            let rt = line.indexOf('\r');
            if (rt != -1) {
                result.push(line.slice(0, rt));
                pos += rt + 1;
            } else {
                result.push(line);
                pos = nl + 1;
            }
        }
        return result;
    } : string => string.split(/\r\n?|\n/);
    let hasSelection = window.getSelection ? te => {
        try {
            return te.selectionStart != te.selectionEnd;
        } catch (e) {
            return false;
        }
    } : te => {
        let range;
        try {
            range = te.ownerDocument.selection.createRange();
        } catch (e) {
        }
        if (!range || range.parentElement() != te)
            return false;
        return range.compareEndPoints('StartToEnd', range) != 0;
    };
    let hasCopyEvent = (() => {
        let e = a.elt('div');
        if ('oncopy' in e)
            return true;
        e.setAttribute('oncopy', 'return;');
        return typeof e.oncopy == 'function';
    })();
    let badZoomedRects = null;
    function hasBadZoomedRects(measure) {
        if (badZoomedRects != null)
            return badZoomedRects;
        let node = a.removeChildrenAndAdd(measure, a.elt('span', 'x'));
        let normal = node.getBoundingClientRect();
        let fromRange = a.range(node, 0, 1).getBoundingClientRect();
        return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;
    }
    return {
        dragAndDrop: dragAndDrop,
        zeroWidthElement: zeroWidthElement,
        hasBadBidiRects: hasBadBidiRects,
        splitLinesAuto: splitLinesAuto,
        hasSelection: hasSelection,
        hasCopyEvent: hasCopyEvent,
        hasBadZoomedRects: hasBadZoomedRects
    };
});
define('skylark-codemirror/primitives/modes',['./util/misc'], function (misc) {
    'use strict';
    let modes = {}, mimeModes = {};
    function defineMode(name, mode) {
        if (arguments.length > 2)
            mode.dependencies = Array.prototype.slice.call(arguments, 2);
        modes[name] = mode;
    }
    function defineMIME(mime, spec) {
        mimeModes[mime] = spec;
    }
    function resolveMode(spec) {
        if (typeof spec == 'string' && mimeModes.hasOwnProperty(spec)) {
            spec = mimeModes[spec];
        } else if (spec && typeof spec.name == 'string' && mimeModes.hasOwnProperty(spec.name)) {
            let found = mimeModes[spec.name];
            if (typeof found == 'string')
                found = { name: found };
            spec = misc.createObj(found, spec);
            spec.name = found.name;
        } else if (typeof spec == 'string' && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
            return resolveMode('application/xml');
        } else if (typeof spec == 'string' && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
            return resolveMode('application/json');
        }
        if (typeof spec == 'string')
            return { name: spec };
        else
            return spec || { name: 'null' };
    }
    function getMode(options, spec) {
        spec = resolveMode(spec);
        let mfactory = modes[spec.name];
        if (!mfactory)
            return getMode(options, 'text/plain');
        let modeObj = mfactory(options, spec);
        if (modeExtensions.hasOwnProperty(spec.name)) {
            let exts = modeExtensions[spec.name];
            for (let prop in exts) {
                if (!exts.hasOwnProperty(prop))
                    continue;
                if (modeObj.hasOwnProperty(prop))
                    modeObj['_' + prop] = modeObj[prop];
                modeObj[prop] = exts[prop];
            }
        }
        modeObj.name = spec.name;
        if (spec.helperType)
            modeObj.helperType = spec.helperType;
        if (spec.modeProps)
            for (let prop in spec.modeProps)
                modeObj[prop] = spec.modeProps[prop];
        return modeObj;
    }
    let modeExtensions = {};
    function extendMode(mode, properties) {
        let exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : modeExtensions[mode] = {};
        misc.copyObj(properties, exts);
    }
    function copyState(mode, state) {
        if (state === true)
            return state;
        if (mode.copyState)
            return mode.copyState(state);
        let nstate = {};
        for (let n in state) {
            let val = state[n];
            if (val instanceof Array)
                val = val.concat([]);
            nstate[n] = val;
        }
        return nstate;
    }
    function innerMode(mode, state) {
        let info;
        while (mode.innerMode) {
            info = mode.innerMode(state);
            if (!info || info.mode == mode)
                break;
            state = info.state;
            mode = info.mode;
        }
        return info || {
            mode: mode,
            state: state
        };
    }
    function startState(mode, a1, a2) {
        return mode.startState ? mode.startState(a1, a2) : true;
    }
    return {
        modes: modes,
        mimeModes: mimeModes,
        defineMode: defineMode,
        defineMIME: defineMIME,
        resolveMode: resolveMode,
        getMode: getMode,
        modeExtensions: modeExtensions,
        extendMode: extendMode,
        copyState: copyState,
        innerMode: innerMode,
        startState: startState
    };
});
define('skylark-codemirror/primitives/util/StringStream',['./misc'], function (a) {
    'use strict';
    class StringStream {
        constructor(string, tabSize, lineOracle) {
            this.pos = this.start = 0;
            this.string = string;
            this.tabSize = tabSize || 8;
            this.lastColumnPos = this.lastColumnValue = 0;
            this.lineStart = 0;
            this.lineOracle = lineOracle;
        }
        eol() {
            return this.pos >= this.string.length;
        }
        sol() {
            return this.pos == this.lineStart;
        }
        peek() {
            return this.string.charAt(this.pos) || undefined;
        }
        next() {
            if (this.pos < this.string.length)
                return this.string.charAt(this.pos++);
        }
        eat(match) {
            let ch = this.string.charAt(this.pos);
            let ok;
            if (typeof match == 'string')
                ok = ch == match;
            else
                ok = ch && (match.test ? match.test(ch) : match(ch));
            if (ok) {
                ++this.pos;
                return ch;
            }
        }
        eatWhile(match) {
            let start = this.pos;
            while (this.eat(match)) {
            }
            return this.pos > start;
        }
        eatSpace() {
            let start = this.pos;
            while (/[\s\u00a0]/.test(this.string.charAt(this.pos)))
                ++this.pos;
            return this.pos > start;
        }
        skipToEnd() {
            this.pos = this.string.length;
        }
        skipTo(ch) {
            let found = this.string.indexOf(ch, this.pos);
            if (found > -1) {
                this.pos = found;
                return true;
            }
        }
        backUp(n) {
            this.pos -= n;
        }
        column() {
            if (this.lastColumnPos < this.start) {
                this.lastColumnValue = a.countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
                this.lastColumnPos = this.start;
            }
            return this.lastColumnValue - (this.lineStart ? a.countColumn(this.string, this.lineStart, this.tabSize) : 0);
        }
        indentation() {
            return a.countColumn(this.string, null, this.tabSize) - (this.lineStart ? a.countColumn(this.string, this.lineStart, this.tabSize) : 0);
        }
        match(pattern, consume, caseInsensitive) {
            if (typeof pattern == 'string') {
                let cased = str => caseInsensitive ? str.toLowerCase() : str;
                let substr = this.string.substr(this.pos, pattern.length);
                if (cased(substr) == cased(pattern)) {
                    if (consume !== false)
                        this.pos += pattern.length;
                    return true;
                }
            } else {
                let match = this.string.slice(this.pos).match(pattern);
                if (match && match.index > 0)
                    return null;
                if (match && consume !== false)
                    this.pos += match[0].length;
                return match;
            }
        }
        current() {
            return this.string.slice(this.start, this.pos);
        }
        hideFirstChars(n, inner) {
            this.lineStart += n;
            try {
                return inner();
            } finally {
                this.lineStart -= n;
            }
        }
        lookAhead(n) {
            let oracle = this.lineOracle;
            return oracle && oracle.lookAhead(n);
        }
        baseToken() {
            let oracle = this.lineOracle;
            return oracle && oracle.baseToken(this.pos);
        }
    }
    return StringStream;
});
define('skylark-codemirror/primitives/line/highlight',[
    '../util/misc',
    '../modes',
    '../util/StringStream',
    './utils_line',
    './pos'
], function (misc, modes, StringStream, utils_line, line_pos) {
    'use strict';
    class SavedContext {
        constructor(state, lookAhead) {
            this.state = state;
            this.lookAhead = lookAhead;
        }
    }
    class Context {
        constructor(doc, state, line, lookAhead) {
            this.state = state;
            this.doc = doc;
            this.line = line;
            this.maxLookAhead = lookAhead || 0;
            this.baseTokens = null;
            this.baseTokenPos = 1;
        }
        lookAhead(n) {
            let line = this.doc.getLine(this.line + n);
            if (line != null && n > this.maxLookAhead)
                this.maxLookAhead = n;
            return line;
        }
        baseToken(n) {
            if (!this.baseTokens)
                return null;
            while (this.baseTokens[this.baseTokenPos] <= n)
                this.baseTokenPos += 2;
            let type = this.baseTokens[this.baseTokenPos + 1];
            return {
                type: type && type.replace(/( |^)overlay .*/, ''),
                size: this.baseTokens[this.baseTokenPos] - n
            };
        }
        nextLine() {
            this.line++;
            if (this.maxLookAhead > 0)
                this.maxLookAhead--;
        }
        static fromSaved(doc, saved, line) {
            if (saved instanceof SavedContext)
                return new Context(doc, modes.copyState(doc.mode, saved.state), line, saved.lookAhead);
            else
                return new Context(doc, modes.copyState(doc.mode, saved), line);
        }
        save(copy) {
            let state = copy !== false ? modes.copyState(this.doc.mode, this.state) : this.state;
            return this.maxLookAhead > 0 ? new SavedContext(state, this.maxLookAhead) : state;
        }
    }
    function highlightLine(cm, line, context, forceToEnd) {
        let st = [cm.state.modeGen], lineClasses = {};
        runMode(cm, line.text, cm.doc.mode, context, (end, style) => st.push(end, style), lineClasses, forceToEnd);
        let state = context.state;
        for (let o = 0; o < cm.state.overlays.length; ++o) {
            context.baseTokens = st;
            let overlay = cm.state.overlays[o], i = 1, at = 0;
            context.state = true;
            runMode(cm, line.text, overlay.mode, context, (end, style) => {
                let start = i;
                while (at < end) {
                    let i_end = st[i];
                    if (i_end > end)
                        st.splice(i, 1, end, st[i + 1], i_end);
                    i += 2;
                    at = Math.min(end, i_end);
                }
                if (!style)
                    return;
                if (overlay.opaque) {
                    st.splice(start, i - start, end, 'overlay ' + style);
                    i = start + 2;
                } else {
                    for (; start < i; start += 2) {
                        let cur = st[start + 1];
                        st[start + 1] = (cur ? cur + ' ' : '') + 'overlay ' + style;
                    }
                }
            }, lineClasses);
            context.state = state;
            context.baseTokens = null;
            context.baseTokenPos = 1;
        }
        return {
            styles: st,
            classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null
        };
    }
    function getLineStyles(cm, line, updateFrontier) {
        if (!line.styles || line.styles[0] != cm.state.modeGen) {
            let context = getContextBefore(cm, utils_line.lineNo(line));
            let resetState = line.text.length > cm.options.maxHighlightLength && modes.copyState(cm.doc.mode, context.state);
            let result = highlightLine(cm, line, context);
            if (resetState)
                context.state = resetState;
            line.stateAfter = context.save(!resetState);
            line.styles = result.styles;
            if (result.classes)
                line.styleClasses = result.classes;
            else if (line.styleClasses)
                line.styleClasses = null;
            if (updateFrontier === cm.doc.highlightFrontier)
                cm.doc.modeFrontier = Math.max(cm.doc.modeFrontier, ++cm.doc.highlightFrontier);
        }
        return line.styles;
    }
    function getContextBefore(cm, n, precise) {
        let doc = cm.doc, display = cm.display;
        if (!doc.mode.startState)
            return new Context(doc, true, n);
        let start = findStartLine(cm, n, precise);
        let saved = start > doc.first && utils_line.getLine(doc, start - 1).stateAfter;
        let context = saved ? Context.fromSaved(doc, saved, start) : new Context(doc, modes.startState(doc.mode), start);
        doc.iter(start, n, line => {
            processLine(cm, line.text, context);
            let pos = context.line;
            line.stateAfter = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo ? context.save() : null;
            context.nextLine();
        });
        if (precise)
            doc.modeFrontier = context.line;
        return context;
    }
    function processLine(cm, text, context, startAt) {
        let mode = cm.doc.mode;
        let stream = new StringStream(text, cm.options.tabSize, context);
        stream.start = stream.pos = startAt || 0;
        if (text == '')
            callBlankLine(mode, context.state);
        while (!stream.eol()) {
            readToken(mode, stream, context.state);
            stream.start = stream.pos;
        }
    }
    function callBlankLine(mode, state) {
        if (mode.blankLine)
            return mode.blankLine(state);
        if (!mode.innerMode)
            return;
        let inner = modes.innerMode(mode, state);
        if (inner.mode.blankLine)
            return inner.mode.blankLine(inner.state);
    }
    function readToken(mode, stream, state, inner) {
        for (let i = 0; i < 10; i++) {
            if (inner)
                inner[0] = modes.innerMode(mode, state).mode;
            let style = mode.token(stream, state);
            if (stream.pos > stream.start)
                return style;
        }
        throw new Error('Mode ' + mode.name + ' failed to advance stream.');
    }
    class Token {
        constructor(stream, type, state) {
            this.start = stream.start;
            this.end = stream.pos;
            this.string = stream.current();
            this.type = type || null;
            this.state = state;
        }
    }
    function takeToken(cm, pos, precise, asArray) {
        let doc = cm.doc, mode = doc.mode, style;
        pos = line_pos.clipPos(doc, pos);
        let line = utils_line.getLine(doc, pos.line), context = getContextBefore(cm, pos.line, precise);
        let stream = new StringStream(line.text, cm.options.tabSize, context), tokens;
        if (asArray)
            tokens = [];
        while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
            stream.start = stream.pos;
            style = readToken(mode, stream, context.state);
            if (asArray)
                tokens.push(new Token(stream, style, modes.copyState(doc.mode, context.state)));
        }
        return asArray ? tokens : new Token(stream, style, context.state);
    }
    function extractLineClasses(type, output) {
        if (type)
            for (;;) {
                let lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
                if (!lineClass)
                    break;
                type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
                let prop = lineClass[1] ? 'bgClass' : 'textClass';
                if (output[prop] == null)
                    output[prop] = lineClass[2];
                else if (!new RegExp('(?:^|s)' + lineClass[2] + '(?:$|s)').test(output[prop]))
                    output[prop] += ' ' + lineClass[2];
            }
        return type;
    }
    function runMode(cm, text, mode, context, f, lineClasses, forceToEnd) {
        let flattenSpans = mode.flattenSpans;
        if (flattenSpans == null)
            flattenSpans = cm.options.flattenSpans;
        let curStart = 0, curStyle = null;
        let stream = new StringStream(text, cm.options.tabSize, context), style;
        let inner = cm.options.addModeClass && [null];
        if (text == '')
            extractLineClasses(callBlankLine(mode, context.state), lineClasses);
        while (!stream.eol()) {
            if (stream.pos > cm.options.maxHighlightLength) {
                flattenSpans = false;
                if (forceToEnd)
                    processLine(cm, text, context, stream.pos);
                stream.pos = text.length;
                style = null;
            } else {
                style = extractLineClasses(readToken(mode, stream, context.state, inner), lineClasses);
            }
            if (inner) {
                let mName = inner[0].name;
                if (mName)
                    style = 'm-' + (style ? mName + ' ' + style : mName);
            }
            if (!flattenSpans || curStyle != style) {
                while (curStart < stream.start) {
                    curStart = Math.min(stream.start, curStart + 5000);
                    f(curStart, curStyle);
                }
                curStyle = style;
            }
            stream.start = stream.pos;
        }
        while (curStart < stream.pos) {
            let pos = Math.min(stream.pos, curStart + 5000);
            f(pos, curStyle);
            curStart = pos;
        }
    }
    function findStartLine(cm, n, precise) {
        let minindent, minline, doc = cm.doc;
        let lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100);
        for (let search = n; search > lim; --search) {
            if (search <= doc.first)
                return doc.first;
            let line = utils_line.getLine(doc, search - 1), after = line.stateAfter;
            if (after && (!precise || search + (after instanceof SavedContext ? after.lookAhead : 0) <= doc.modeFrontier))
                return search;
            let indented = misc.countColumn(line.text, null, cm.options.tabSize);
            if (minline == null || minindent > indented) {
                minline = search - 1;
                minindent = indented;
            }
        }
        return minline;
    }
    function retreatFrontier(doc, n) {
        doc.modeFrontier = Math.min(doc.modeFrontier, n);
        if (doc.highlightFrontier < n - 10)
            return;
        let start = doc.first;
        for (let line = n - 1; line > start; line--) {
            let saved = utils_line.getLine(doc, line).stateAfter;
            if (saved && (!(saved instanceof SavedContext) || line + saved.lookAhead < n)) {
                start = line + 1;
                break;
            }
        }
        doc.highlightFrontier = Math.min(doc.highlightFrontier, start);
    }
    return {
        highlightLine: highlightLine,
        getLineStyles: getLineStyles,
        getContextBefore: getContextBefore,
        processLine: processLine,
        takeToken: takeToken,
        retreatFrontier: retreatFrontier
    };
});
define('skylark-codemirror/primitives/line/line_data',[
    '../util/bidi',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/feature_detection',
    '../util/misc',
    './highlight',
    './spans',
    './utils_line'
], function (bidi, browser, dom, events, feature_detection, misc, highlight, spans, m_utils_line) {
    'use strict';
    class Line {
        constructor(text, markedSpans, estimateHeight) {
            this.text = text;
            spans.attachMarkedSpans(this, markedSpans);
            this.height = estimateHeight ? estimateHeight(this) : 1;
        }
        lineNo() {
            return m_utils_line.lineNo(this);
        }
    }
    events.eventMixin(Line);
    function updateLine(line, text, markedSpans, estimateHeight) {
        line.text = text;
        if (line.stateAfter)
            line.stateAfter = null;
        if (line.styles)
            line.styles = null;
        if (line.order != null)
            line.order = null;
        spans.detachMarkedSpans(line);
        spans.attachMarkedSpans(line, markedSpans);
        let estHeight = estimateHeight ? estimateHeight(line) : 1;
        if (estHeight != line.height)
            m_utils_line.updateLineHeight(line, estHeight);
    }
    function cleanUpLine(line) {
        line.parent = null;
        spans.detachMarkedSpans(line);
    }
    let styleToClassCache = {}, styleToClassCacheWithMode = {};
    function interpretTokenStyle(style, options) {
        if (!style || /^\s*$/.test(style))
            return null;
        let cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
        return cache[style] || (cache[style] = style.replace(/\S+/g, 'cm-$&'));
    }
    function buildLineContent(cm, lineView) {
        let content = dom.eltP('span', null, null, browser.webkit ? 'padding-right: .1px' : null);
        let builder = {
            pre: dom.eltP('pre', [content], 'CodeMirror-line'),
            content: content,
            col: 0,
            pos: 0,
            cm: cm,
            trailingSpace: false,
            splitSpaces: cm.getOption('lineWrapping')
        };
        lineView.measure = {};
        for (let i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
            let line = i ? lineView.rest[i - 1] : lineView.line, order;
            builder.pos = 0;
            builder.addToken = buildToken;
            if (feature_detection.hasBadBidiRects(cm.display.measure) && (order = bidi.getOrder(line, cm.doc.direction)))
                builder.addToken = buildTokenBadBidi(builder.addToken, order);
            builder.map = [];
            let allowFrontierUpdate = lineView != cm.display.externalMeasured && m_utils_line.lineNo(line);
            insertLineContent(line, builder, highlight.getLineStyles(cm, line, allowFrontierUpdate));
            if (line.styleClasses) {
                if (line.styleClasses.bgClass)
                    builder.bgClass = dom.joinClasses(line.styleClasses.bgClass, builder.bgClass || '');
                if (line.styleClasses.textClass)
                    builder.textClass = dom.joinClasses(line.styleClasses.textClass, builder.textClass || '');
            }
            if (builder.map.length == 0)
                builder.map.push(0, 0, builder.content.appendChild(feature_detection.zeroWidthElement(cm.display.measure)));
            if (i == 0) {
                lineView.measure.map = builder.map;
                lineView.measure.cache = {};
            } else {
                ;
                (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map);
                (lineView.measure.caches || (lineView.measure.caches = [])).push({});
            }
        }
        if (browser.webkit) {
            let last = builder.content.lastChild;
            if (/\bcm-tab\b/.test(last.className) || last.querySelector && last.querySelector('.cm-tab'))
                builder.content.className = 'cm-tab-wrap-hack';
        }
        events.signal(cm, 'renderLine', cm, lineView.line, builder.pre);
        if (builder.pre.className)
            builder.textClass = dom.joinClasses(builder.pre.className, builder.textClass || '');
        return builder;
    }
    function defaultSpecialCharPlaceholder(ch) {
        let token = dom.elt('span', '\u2022', 'cm-invalidchar');
        token.title = '\\u' + ch.charCodeAt(0).toString(16);
        token.setAttribute('aria-label', token.title);
        return token;
    }
    function buildToken(builder, text, style, startStyle, endStyle, css, attributes) {
        if (!text)
            return;
        let displayText = builder.splitSpaces ? splitSpaces(text, builder.trailingSpace) : text;
        let special = builder.cm.state.specialChars, mustWrap = false;
        let content;
        if (!special.test(text)) {
            builder.col += text.length;
            content = document.createTextNode(displayText);
            builder.map.push(builder.pos, builder.pos + text.length, content);
            if (browser.ie && browser.ie_version < 9)
                mustWrap = true;
            builder.pos += text.length;
        } else {
            content = document.createDocumentFragment();
            let pos = 0;
            while (true) {
                special.lastIndex = pos;
                let m = special.exec(text);
                let skipped = m ? m.index - pos : text.length - pos;
                if (skipped) {
                    let txt = document.createTextNode(displayText.slice(pos, pos + skipped));
                    if (browser.ie && browser.ie_version < 9)
                        content.appendChild(dom.elt('span', [txt]));
                    else
                        content.appendChild(txt);
                    builder.map.push(builder.pos, builder.pos + skipped, txt);
                    builder.col += skipped;
                    builder.pos += skipped;
                }
                if (!m)
                    break;
                pos += skipped + 1;
                let txt;
                if (m[0] == '\t') {
                    let tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
                    txt = content.appendChild(dom.elt('span', misc.spaceStr(tabWidth), 'cm-tab'));
                    txt.setAttribute('role', 'presentation');
                    txt.setAttribute('cm-text', '\t');
                    builder.col += tabWidth;
                } else if (m[0] == '\r' || m[0] == '\n') {
                    txt = content.appendChild(dom.elt('span', m[0] == '\r' ? '\u240D' : '\u2424', 'cm-invalidchar'));
                    txt.setAttribute('cm-text', m[0]);
                    builder.col += 1;
                } else {
                    txt = builder.cm.options.specialCharPlaceholder(m[0]);
                    txt.setAttribute('cm-text', m[0]);
                    if (browser.ie && browser.ie_version < 9)
                        content.appendChild(dom.elt('span', [txt]));
                    else
                        content.appendChild(txt);
                    builder.col += 1;
                }
                builder.map.push(builder.pos, builder.pos + 1, txt);
                builder.pos++;
            }
        }
        builder.trailingSpace = displayText.charCodeAt(text.length - 1) == 32;
        if (style || startStyle || endStyle || mustWrap || css) {
            let fullStyle = style || '';
            if (startStyle)
                fullStyle += startStyle;
            if (endStyle)
                fullStyle += endStyle;
            let token = dom.elt('span', [content], fullStyle, css);
            if (attributes) {
                for (let attr in attributes)
                    if (attributes.hasOwnProperty(attr) && attr != 'style' && attr != 'class')
                        token.setAttribute(attr, attributes[attr]);
            }
            return builder.content.appendChild(token);
        }
        builder.content.appendChild(content);
    }
    function splitSpaces(text, trailingBefore) {
        if (text.length > 1 && !/  /.test(text))
            return text;
        let spaceBefore = trailingBefore, result = '';
        for (let i = 0; i < text.length; i++) {
            let ch = text.charAt(i);
            if (ch == ' ' && spaceBefore && (i == text.length - 1 || text.charCodeAt(i + 1) == 32))
                ch = '\xA0';
            result += ch;
            spaceBefore = ch == ' ';
        }
        return result;
    }
    function buildTokenBadBidi(inner, order) {
        return (builder, text, style, startStyle, endStyle, css, attributes) => {
            style = style ? style + ' cm-force-border' : 'cm-force-border';
            let start = builder.pos, end = start + text.length;
            for (;;) {
                let part;
                for (let i = 0; i < order.length; i++) {
                    part = order[i];
                    if (part.to > start && part.from <= start)
                        break;
                }
                if (part.to >= end)
                    return inner(builder, text, style, startStyle, endStyle, css, attributes);
                inner(builder, text.slice(0, part.to - start), style, startStyle, null, css, attributes);
                startStyle = null;
                text = text.slice(part.to - start);
                start = part.to;
            }
        };
    }
    function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
        let widget = !ignoreWidget && marker.widgetNode;
        if (widget)
            builder.map.push(builder.pos, builder.pos + size, widget);
        if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
            if (!widget)
                widget = builder.content.appendChild(document.createElement('span'));
            widget.setAttribute('cm-marker', marker.id);
        }
        if (widget) {
            builder.cm.display.input.setUneditable(widget);
            builder.content.appendChild(widget);
        }
        builder.pos += size;
        builder.trailingSpace = false;
    }
    function insertLineContent(line, builder, styles) {
        let spans = line.markedSpans, allText = line.text, at = 0;
        if (!spans) {
            for (let i = 1; i < styles.length; i += 2)
                builder.addToken(builder, allText.slice(at, at = styles[i]), interpretTokenStyle(styles[i + 1], builder.cm.options));
            return;
        }
        let len = allText.length, pos = 0, i = 1, text = '', style, css;
        let nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, collapsed, attributes;
        for (;;) {
            if (nextChange == pos) {
                spanStyle = spanEndStyle = spanStartStyle = css = '';
                attributes = null;
                collapsed = null;
                nextChange = Infinity;
                let foundBookmarks = [], endStyles;
                for (let j = 0; j < spans.length; ++j) {
                    let sp = spans[j], m = sp.marker;
                    if (m.type == 'bookmark' && sp.from == pos && m.widgetNode) {
                        foundBookmarks.push(m);
                    } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
                        if (sp.to != null && sp.to != pos && nextChange > sp.to) {
                            nextChange = sp.to;
                            spanEndStyle = '';
                        }
                        if (m.className)
                            spanStyle += ' ' + m.className;
                        if (m.css)
                            css = (css ? css + ';' : '') + m.css;
                        if (m.startStyle && sp.from == pos)
                            spanStartStyle += ' ' + m.startStyle;
                        if (m.endStyle && sp.to == nextChange)
                            (endStyles || (endStyles = [])).push(m.endStyle, sp.to);
                        if (m.title)
                            (attributes || (attributes = {})).title = m.title;
                        if (m.attributes) {
                            for (let attr in m.attributes)
                                (attributes || (attributes = {}))[attr] = m.attributes[attr];
                        }
                        if (m.collapsed && (!collapsed || spans.compareCollapsedMarkers(collapsed.marker, m) < 0))
                            collapsed = sp;
                    } else if (sp.from > pos && nextChange > sp.from) {
                        nextChange = sp.from;
                    }
                }
                if (endStyles)
                    for (let j = 0; j < endStyles.length; j += 2)
                        if (endStyles[j + 1] == nextChange)
                            spanEndStyle += ' ' + endStyles[j];
                if (!collapsed || collapsed.from == pos)
                    for (let j = 0; j < foundBookmarks.length; ++j)
                        buildCollapsedSpan(builder, 0, foundBookmarks[j]);
                if (collapsed && (collapsed.from || 0) == pos) {
                    buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos, collapsed.marker, collapsed.from == null);
                    if (collapsed.to == null)
                        return;
                    if (collapsed.to == pos)
                        collapsed = false;
                }
            }
            if (pos >= len)
                break;
            let upto = Math.min(len, nextChange);
            while (true) {
                if (text) {
                    let end = pos + text.length;
                    if (!collapsed) {
                        let tokenText = end > upto ? text.slice(0, upto - pos) : text;
                        builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle, spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : '', css, attributes);
                    }
                    if (end >= upto) {
                        text = text.slice(upto - pos);
                        pos = upto;
                        break;
                    }
                    pos = end;
                    spanStartStyle = '';
                }
                text = allText.slice(at, at = styles[i++]);
                style = interpretTokenStyle(styles[i++], builder.cm.options);
            }
        }
    }
    function LineView(doc, line, lineN) {
        this.line = line;
        this.rest = spans.visualLineContinued(line);
        this.size = this.rest ? m_utils_line.lineNo(misc.lst(this.rest)) - lineN + 1 : 1;
        this.node = this.text = null;
        this.hidden = spans.lineIsHidden(doc, line);
    }
    function buildViewArray(cm, from, to) {
        let array = [], nextPos;
        for (let pos = from; pos < to; pos = nextPos) {
            let view = new LineView(cm.doc, m_utils_line.getLine(cm.doc, pos), pos);
            nextPos = pos + view.size;
            array.push(view);
        }
        return array;
    }
    return {
        Line: Line,
        updateLine: updateLine,
        cleanUpLine: cleanUpLine,
        buildLineContent: buildLineContent,
        defaultSpecialCharPlaceholder: defaultSpecialCharPlaceholder,
        LineView: LineView,
        buildViewArray: buildViewArray
    };
});
define('skylark-codemirror/primitives/util/operation_group',['./event'], function (a) {
    'use strict';
    let operationGroup = null;
    function pushOperation(op) {
        if (operationGroup) {
            operationGroup.ops.push(op);
        } else {
            op.ownsGroup = operationGroup = {
                ops: [op],
                delayedCallbacks: []
            };
        }
    }
    function fireCallbacksForOps(group) {
        let callbacks = group.delayedCallbacks, i = 0;
        do {
            for (; i < callbacks.length; i++)
                callbacks[i].call(null);
            for (let j = 0; j < group.ops.length; j++) {
                let op = group.ops[j];
                if (op.cursorActivityHandlers)
                    while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
                        op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm);
            }
        } while (i < callbacks.length);
    }
    function finishOperation(op, endCb) {
        let group = op.ownsGroup;
        if (!group)
            return;
        try {
            fireCallbacksForOps(group);
        } finally {
            operationGroup = null;
            endCb(group);
        }
    }
    let orphanDelayedCallbacks = null;
    function signalLater(emitter, type) {
        let arr = a.getHandlers(emitter, type);
        if (!arr.length)
            return;
        let args = Array.prototype.slice.call(arguments, 2), list;
        if (operationGroup) {
            list = operationGroup.delayedCallbacks;
        } else if (orphanDelayedCallbacks) {
            list = orphanDelayedCallbacks;
        } else {
            list = orphanDelayedCallbacks = [];
            setTimeout(fireOrphanDelayed, 0);
        }
        for (let i = 0; i < arr.length; ++i)
            list.push(() => arr[i].apply(null, args));
    }
    function fireOrphanDelayed() {
        let delayed = orphanDelayedCallbacks;
        orphanDelayedCallbacks = null;
        for (let i = 0; i < delayed.length; ++i)
            delayed[i]();
    }
    return {
        pushOperation: pushOperation,
        finishOperation: finishOperation,
        signalLater: signalLater
    };
});
define('skylark-codemirror/primitives/display/update_line',[
    '../line/line_data',
    '../line/utils_line',
    '../util/browser',
    '../util/dom',
    '../util/operation_group'
], function (a, b, c, d, e) {
    'use strict';
    function updateLineForChanges(cm, lineView, lineN, dims) {
        for (let j = 0; j < lineView.changes.length; j++) {
            let type = lineView.changes[j];
            if (type == 'text')
                updateLineText(cm, lineView);
            else if (type == 'gutter')
                updateLineGutter(cm, lineView, lineN, dims);
            else if (type == 'class')
                updateLineClasses(cm, lineView);
            else if (type == 'widget')
                updateLineWidgets(cm, lineView, dims);
        }
        lineView.changes = null;
    }
    function ensureLineWrapped(lineView) {
        if (lineView.node == lineView.text) {
            lineView.node = d.elt('div', null, null, 'position: relative');
            if (lineView.text.parentNode)
                lineView.text.parentNode.replaceChild(lineView.node, lineView.text);
            lineView.node.appendChild(lineView.text);
            if (c.ie && c.ie_version < 8)
                lineView.node.style.zIndex = 2;
        }
        return lineView.node;
    }
    function updateLineBackground(cm, lineView) {
        let cls = lineView.bgClass ? lineView.bgClass + ' ' + (lineView.line.bgClass || '') : lineView.line.bgClass;
        if (cls)
            cls += ' CodeMirror-linebackground';
        if (lineView.background) {
            if (cls)
                lineView.background.className = cls;
            else {
                lineView.background.parentNode.removeChild(lineView.background);
                lineView.background = null;
            }
        } else if (cls) {
            let wrap = ensureLineWrapped(lineView);
            lineView.background = wrap.insertBefore(d.elt('div', null, cls), wrap.firstChild);
            cm.display.input.setUneditable(lineView.background);
        }
    }
    function getLineContent(cm, lineView) {
        let ext = cm.display.externalMeasured;
        if (ext && ext.line == lineView.line) {
            cm.display.externalMeasured = null;
            lineView.measure = ext.measure;
            return ext.built;
        }
        return a.buildLineContent(cm, lineView);
    }
    function updateLineText(cm, lineView) {
        let cls = lineView.text.className;
        let built = getLineContent(cm, lineView);
        if (lineView.text == lineView.node)
            lineView.node = built.pre;
        lineView.text.parentNode.replaceChild(built.pre, lineView.text);
        lineView.text = built.pre;
        if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
            lineView.bgClass = built.bgClass;
            lineView.textClass = built.textClass;
            updateLineClasses(cm, lineView);
        } else if (cls) {
            lineView.text.className = cls;
        }
    }
    function updateLineClasses(cm, lineView) {
        updateLineBackground(cm, lineView);
        if (lineView.line.wrapClass)
            ensureLineWrapped(lineView).className = lineView.line.wrapClass;
        else if (lineView.node != lineView.text)
            lineView.node.className = '';
        let textClass = lineView.textClass ? lineView.textClass + ' ' + (lineView.line.textClass || '') : lineView.line.textClass;
        lineView.text.className = textClass || '';
    }
    function updateLineGutter(cm, lineView, lineN, dims) {
        if (lineView.gutter) {
            lineView.node.removeChild(lineView.gutter);
            lineView.gutter = null;
        }
        if (lineView.gutterBackground) {
            lineView.node.removeChild(lineView.gutterBackground);
            lineView.gutterBackground = null;
        }
        if (lineView.line.gutterClass) {
            let wrap = ensureLineWrapped(lineView);
            lineView.gutterBackground = d.elt('div', null, 'CodeMirror-gutter-background ' + lineView.line.gutterClass, `left: ${ cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth }px; width: ${ dims.gutterTotalWidth }px`);
            cm.display.input.setUneditable(lineView.gutterBackground);
            wrap.insertBefore(lineView.gutterBackground, lineView.text);
        }
        let markers = lineView.line.gutterMarkers;
        if (cm.options.lineNumbers || markers) {
            let wrap = ensureLineWrapped(lineView);
            let gutterWrap = lineView.gutter = d.elt('div', null, 'CodeMirror-gutter-wrapper', `left: ${ cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth }px`);
            cm.display.input.setUneditable(gutterWrap);
            wrap.insertBefore(gutterWrap, lineView.text);
            if (lineView.line.gutterClass)
                gutterWrap.className += ' ' + lineView.line.gutterClass;
            if (cm.options.lineNumbers && (!markers || !markers['CodeMirror-linenumbers']))
                lineView.lineNumber = gutterWrap.appendChild(d.elt('div', b.lineNumberFor(cm.options, lineN), 'CodeMirror-linenumber CodeMirror-gutter-elt', `left: ${ dims.gutterLeft['CodeMirror-linenumbers'] }px; width: ${ cm.display.lineNumInnerWidth }px`));
            if (markers)
                for (let k = 0; k < cm.options.gutters.length; ++k) {
                    let id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id];
                    if (found)
                        gutterWrap.appendChild(d.elt('div', [found], 'CodeMirror-gutter-elt', `left: ${ dims.gutterLeft[id] }px; width: ${ dims.gutterWidth[id] }px`));
                }
        }
    }
    function updateLineWidgets(cm, lineView, dims) {
        if (lineView.alignable)
            lineView.alignable = null;
        for (let node = lineView.node.firstChild, next; node; node = next) {
            next = node.nextSibling;
            if (node.className == 'CodeMirror-linewidget')
                lineView.node.removeChild(node);
        }
        insertLineWidgets(cm, lineView, dims);
    }
    function buildLineElement(cm, lineView, lineN, dims) {
        let built = getLineContent(cm, lineView);
        lineView.text = lineView.node = built.pre;
        if (built.bgClass)
            lineView.bgClass = built.bgClass;
        if (built.textClass)
            lineView.textClass = built.textClass;
        updateLineClasses(cm, lineView);
        updateLineGutter(cm, lineView, lineN, dims);
        insertLineWidgets(cm, lineView, dims);
        return lineView.node;
    }
    function insertLineWidgets(cm, lineView, dims) {
        insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
        if (lineView.rest)
            for (let i = 0; i < lineView.rest.length; i++)
                insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false);
    }
    function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
        if (!line.widgets)
            return;
        let wrap = ensureLineWrapped(lineView);
        for (let i = 0, ws = line.widgets; i < ws.length; ++i) {
            let widget = ws[i], node = d.elt('div', [widget.node], 'CodeMirror-linewidget');
            if (!widget.handleMouseEvents)
                node.setAttribute('cm-ignore-events', 'true');
            positionLineWidget(widget, node, lineView, dims);
            cm.display.input.setUneditable(node);
            if (allowAbove && widget.above)
                wrap.insertBefore(node, lineView.gutter || lineView.text);
            else
                wrap.appendChild(node);
            e.signalLater(widget, 'redraw');
        }
    }
    function positionLineWidget(widget, node, lineView, dims) {
        if (widget.noHScroll) {
            ;
            (lineView.alignable || (lineView.alignable = [])).push(node);
            let width = dims.wrapperWidth;
            node.style.left = dims.fixedPos + 'px';
            if (!widget.coverGutter) {
                width -= dims.gutterTotalWidth;
                node.style.paddingLeft = dims.gutterTotalWidth + 'px';
            }
            node.style.width = width + 'px';
        }
        if (widget.coverGutter) {
            node.style.zIndex = 5;
            node.style.position = 'relative';
            if (!widget.noHScroll)
                node.style.marginLeft = -dims.gutterTotalWidth + 'px';
        }
    }
    return {
        updateLineForChanges: updateLineForChanges,
        buildLineElement: buildLineElement
    };
});
define('skylark-codemirror/primitives/measurement/widgets',[
    '../util/dom',
    '../util/event'
], function (dom, events) {
    'use strict';
    function widgetHeight(widget) {
        if (widget.height != null)
            return widget.height;
        let cm = widget.doc.cm;
        if (!cm)
            return 0;
        if (!dom.contains(document.body, widget.node)) {
            let parentStyle = 'position: relative;';
            if (widget.coverGutter)
                parentStyle += 'margin-left: -' + cm.display.gutters.offsetWidth + 'px;';
            if (widget.noHScroll)
                parentStyle += 'width: ' + cm.display.wrapper.clientWidth + 'px;';
            dom.removeChildrenAndAdd(cm.display.measure, dom.elt('div', [widget.node], null, parentStyle));
        }
        return widget.height = widget.node.parentNode.offsetHeight;
    }
    function eventInWidget(display, e) {
        for (let n = events.e_target(e); n != display.wrapper; n = n.parentNode) {
            if (!n || n.nodeType == 1 && n.getAttribute('cm-ignore-events') == 'true' || n.parentNode == display.sizer && n != display.mover)
                return true;
        }
    }
    return {
        widgetHeight: widgetHeight,
        eventInWidget: eventInWidget
    };
});
define('skylark-codemirror/primitives/measurement/position_measurement',[
    '../line/line_data',
    '../line/pos',
    '../line/spans',
    '../line/utils_line',
    '../util/bidi',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/feature_detection',
    '../util/misc',
    '../display/update_line',
    './widgets'
], function (line_data, line_pos, spans, utils_line, bidi, browser, dom, events, feature_detection, misc, update_line, widgets) {
    'use strict';
    function paddingTop(display) {
        return display.lineSpace.offsetTop;
    }
    function paddingVert(display) {
        return display.mover.offsetHeight - display.lineSpace.offsetHeight;
    }
    function paddingH(display) {
        if (display.cachedPaddingH)
            return display.cachedPaddingH;
        let e = dom.removeChildrenAndAdd(display.measure, dom.elt('pre', 'x'));
        let style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
        let data = {
            left: parseInt(style.paddingLeft),
            right: parseInt(style.paddingRight)
        };
        if (!isNaN(data.left) && !isNaN(data.right))
            display.cachedPaddingH = data;
        return data;
    }
    function scrollGap(cm) {
        return misc.scrollerGap - cm.display.nativeBarWidth;
    }
    function displayWidth(cm) {
        return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth;
    }
    function displayHeight(cm) {
        return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight;
    }
    function ensureLineHeights(cm, lineView, rect) {
        let wrapping = cm.options.lineWrapping;
        let curWidth = wrapping && displayWidth(cm);
        if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
            let heights = lineView.measure.heights = [];
            if (wrapping) {
                lineView.measure.width = curWidth;
                let rects = lineView.text.firstChild.getClientRects();
                for (let i = 0; i < rects.length - 1; i++) {
                    let cur = rects[i], next = rects[i + 1];
                    if (Math.abs(cur.bottom - next.bottom) > 2)
                        heights.push((cur.bottom + next.top) / 2 - rect.top);
                }
            }
            heights.push(rect.bottom - rect.top);
        }
    }
    function mapFromLineView(lineView, line, lineN) {
        if (lineView.line == line)
            return {
                map: lineView.measure.map,
                cache: lineView.measure.cache
            };
        for (let i = 0; i < lineView.rest.length; i++)
            if (lineView.rest[i] == line)
                return {
                    map: lineView.measure.maps[i],
                    cache: lineView.measure.caches[i]
                };
        for (let i = 0; i < lineView.rest.length; i++)
            if (utils_line.lineNo(lineView.rest[i]) > lineN)
                return {
                    map: lineView.measure.maps[i],
                    cache: lineView.measure.caches[i],
                    before: true
                };
    }
    function updateExternalMeasurement(cm, line) {
        line = spans.visualLine(line);
        let lineN = utils_line.lineNo(line);
        let view = cm.display.externalMeasured = new line_data.LineView(cm.doc, line, lineN);
        view.lineN = lineN;
        let built = view.built = line_data.buildLineContent(cm, view);
        view.text = built.pre;
        dom.removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
        return view;
    }
    function measureChar(cm, line, ch, bias) {
        return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias);
    }
    function findViewForLine(cm, lineN) {
        if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
            return cm.display.view[findViewIndex(cm, lineN)];
        let ext = cm.display.externalMeasured;
        if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
            return ext;
    }
    function prepareMeasureForLine(cm, line) {
        let lineN = utils_line.lineNo(line);
        let view = findViewForLine(cm, lineN);
        if (view && !view.text) {
            view = null;
        } else if (view && view.changes) {
            update_line.updateLineForChanges(cm, view, lineN, getDimensions(cm));
            cm.curOp.forceUpdate = true;
        }
        if (!view)
            view = updateExternalMeasurement(cm, line);
        let info = mapFromLineView(view, line, lineN);
        return {
            line: line,
            view: view,
            rect: null,
            map: info.map,
            cache: info.cache,
            before: info.before,
            hasHeights: false
        };
    }
    function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
        if (prepared.before)
            ch = -1;
        let key = ch + (bias || ''), found;
        if (prepared.cache.hasOwnProperty(key)) {
            found = prepared.cache[key];
        } else {
            if (!prepared.rect)
                prepared.rect = prepared.view.text.getBoundingClientRect();
            if (!prepared.hasHeights) {
                ensureLineHeights(cm, prepared.view, prepared.rect);
                prepared.hasHeights = true;
            }
            found = measureCharInner(cm, prepared, ch, bias);
            if (!found.bogus)
                prepared.cache[key] = found;
        }
        return {
            left: found.left,
            right: found.right,
            top: varHeight ? found.rtop : found.top,
            bottom: varHeight ? found.rbottom : found.bottom
        };
    }
    let nullRect = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
    function nodeAndOffsetInLineMap(map, ch, bias) {
        let node, start, end, collapse, mStart, mEnd;
        for (let i = 0; i < map.length; i += 3) {
            mStart = map[i];
            mEnd = map[i + 1];
            if (ch < mStart) {
                start = 0;
                end = 1;
                collapse = 'left';
            } else if (ch < mEnd) {
                start = ch - mStart;
                end = start + 1;
            } else if (i == map.length - 3 || ch == mEnd && map[i + 3] > ch) {
                end = mEnd - mStart;
                start = end - 1;
                if (ch >= mEnd)
                    collapse = 'right';
            }
            if (start != null) {
                node = map[i + 2];
                if (mStart == mEnd && bias == (node.insertLeft ? 'left' : 'right'))
                    collapse = bias;
                if (bias == 'left' && start == 0)
                    while (i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {
                        node = map[(i -= 3) + 2];
                        collapse = 'left';
                    }
                if (bias == 'right' && start == mEnd - mStart)
                    while (i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {
                        node = map[(i += 3) + 2];
                        collapse = 'right';
                    }
                break;
            }
        }
        return {
            node: node,
            start: start,
            end: end,
            collapse: collapse,
            coverStart: mStart,
            coverEnd: mEnd
        };
    }
    function getUsefulRect(rects, bias) {
        let rect = nullRect;
        if (bias == 'left')
            for (let i = 0; i < rects.length; i++) {
                if ((rect = rects[i]).left != rect.right)
                    break;
            }
        else
            for (let i = rects.length - 1; i >= 0; i--) {
                if ((rect = rects[i]).left != rect.right)
                    break;
            }
        return rect;
    }
    function measureCharInner(cm, prepared, ch, bias) {
        let place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
        let node = place.node, start = place.start, end = place.end, collapse = place.collapse;
        let rect;
        if (node.nodeType == 3) {
            for (let i = 0; i < 4; i++) {
                while (start && misc.isExtendingChar(prepared.line.text.charAt(place.coverStart + start)))
                    --start;
                while (place.coverStart + end < place.coverEnd && misc.isExtendingChar(prepared.line.text.charAt(place.coverStart + end)))
                    ++end;
                if (browser.ie && browser.ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
                    rect = node.parentNode.getBoundingClientRect();
                else
                    rect = getUsefulRect(dom.range(node, start, end).getClientRects(), bias);
                if (rect.left || rect.right || start == 0)
                    break;
                end = start;
                start = start - 1;
                collapse = 'right';
            }
            if (browser.ie && browser.ie_version < 11)
                rect = maybeUpdateRectForZooming(cm.display.measure, rect);
        } else {
            if (start > 0)
                collapse = bias = 'right';
            let rects;
            if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
                rect = rects[bias == 'right' ? rects.length - 1 : 0];
            else
                rect = node.getBoundingClientRect();
        }
        if (browser.ie && browser.ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
            let rSpan = node.parentNode.getClientRects()[0];
            if (rSpan)
                rect = {
                    left: rSpan.left,
                    right: rSpan.left + charWidth(cm.display),
                    top: rSpan.top,
                    bottom: rSpan.bottom
                };
            else
                rect = nullRect;
        }
        let rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
        let mid = (rtop + rbot) / 2;
        let heights = prepared.view.measure.heights;
        let i = 0;
        for (; i < heights.length - 1; i++)
            if (mid < heights[i])
                break;
        let top = i ? heights[i - 1] : 0, bot = heights[i];
        let result = {
            left: (collapse == 'right' ? rect.right : rect.left) - prepared.rect.left,
            right: (collapse == 'left' ? rect.left : rect.right) - prepared.rect.left,
            top: top,
            bottom: bot
        };
        if (!rect.left && !rect.right)
            result.bogus = true;
        if (!cm.options.singleCursorHeightPerLine) {
            result.rtop = rtop;
            result.rbottom = rbot;
        }
        return result;
    }
    function maybeUpdateRectForZooming(measure, rect) {
        if (!window.screen || screen.logicalXDPI == null || screen.logicalXDPI == screen.deviceXDPI || !feature_detection.hasBadZoomedRects(measure))
            return rect;
        let scaleX = screen.logicalXDPI / screen.deviceXDPI;
        let scaleY = screen.logicalYDPI / screen.deviceYDPI;
        return {
            left: rect.left * scaleX,
            right: rect.right * scaleX,
            top: rect.top * scaleY,
            bottom: rect.bottom * scaleY
        };
    }
    function clearLineMeasurementCacheFor(lineView) {
        if (lineView.measure) {
            lineView.measure.cache = {};
            lineView.measure.heights = null;
            if (lineView.rest)
                for (let i = 0; i < lineView.rest.length; i++)
                    lineView.measure.caches[i] = {};
        }
    }
    function clearLineMeasurementCache(cm) {
        cm.display.externalMeasure = null;
        dom.removeChildren(cm.display.lineMeasure);
        for (let i = 0; i < cm.display.view.length; i++)
            clearLineMeasurementCacheFor(cm.display.view[i]);
    }
    function clearCaches(cm) {
        clearLineMeasurementCache(cm);
        cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
        if (!cm.options.lineWrapping)
            cm.display.maxLineChanged = true;
        cm.display.lineNumChars = null;
    }
    function pageScrollX() {
        if (browser.chrome && browser.android)
            return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft));
        return window.pageXOffset || (document.documentElement || document.body).scrollLeft;
    }
    function pageScrollY() {
        if (browser.chrome && browser.android)
            return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop));
        return window.pageYOffset || (document.documentElement || document.body).scrollTop;
    }
    function widgetTopHeight(lineObj) {
        let height = 0;
        if (lineObj.widgets)
            for (let i = 0; i < lineObj.widgets.length; ++i)
                if (lineObj.widgets[i].above)
                    height += widgets.widgetHeight(lineObj.widgets[i]);
        return height;
    }
    function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
        if (!includeWidgets) {
            let height = widgetTopHeight(lineObj);
            rect.top += height;
            rect.bottom += height;
        }
        if (context == 'line')
            return rect;
        if (!context)
            context = 'local';
        let yOff = spans.heightAtLine(lineObj);
        if (context == 'local')
            yOff += paddingTop(cm.display);
        else
            yOff -= cm.display.viewOffset;
        if (context == 'page' || context == 'window') {
            let lOff = cm.display.lineSpace.getBoundingClientRect();
            yOff += lOff.top + (context == 'window' ? 0 : pageScrollY());
            let xOff = lOff.left + (context == 'window' ? 0 : pageScrollX());
            rect.left += xOff;
            rect.right += xOff;
        }
        rect.top += yOff;
        rect.bottom += yOff;
        return rect;
    }
    function fromCoordSystem(cm, coords, context) {
        if (context == 'div')
            return coords;
        let left = coords.left, top = coords.top;
        if (context == 'page') {
            left -= pageScrollX();
            top -= pageScrollY();
        } else if (context == 'local' || !context) {
            let localBox = cm.display.sizer.getBoundingClientRect();
            left += localBox.left;
            top += localBox.top;
        }
        let lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
        return {
            left: left - lineSpaceBox.left,
            top: top - lineSpaceBox.top
        };
    }
    function charCoords(cm, pos, context, lineObj, bias) {
        if (!lineObj)
            lineObj = utils_line.getLine(cm.doc, pos.line);
        return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context);
    }
    function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
        lineObj = lineObj || utils_line.getLine(cm.doc, pos.line);
        if (!preparedMeasure)
            preparedMeasure = prepareMeasureForLine(cm, lineObj);
        function get(ch, right) {
            let m = measureCharPrepared(cm, preparedMeasure, ch, right ? 'right' : 'left', varHeight);
            if (right)
                m.left = m.right;
            else
                m.right = m.left;
            return intoCoordSystem(cm, lineObj, m, context);
        }
        let order = bidi.getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky;
        if (ch >= lineObj.text.length) {
            ch = lineObj.text.length;
            sticky = 'before';
        } else if (ch <= 0) {
            ch = 0;
            sticky = 'after';
        }
        if (!order)
            return get(sticky == 'before' ? ch - 1 : ch, sticky == 'before');
        function getBidi(ch, partPos, invert) {
            let part = order[partPos], right = part.level == 1;
            return get(invert ? ch - 1 : ch, right != invert);
        }
        let partPos = bidi.getBidiPartAt(order, ch, sticky);
        let other = bidi.bidiOther;
        let val = getBidi(ch, partPos, sticky == 'before');
        if (other != null)
            val.other = getBidi(ch, other, sticky != 'before');
        return val;
    }
    function estimateCoords(cm, pos) {
        let left = 0;
        pos = line_pos.clipPos(cm.doc, pos);
        if (!cm.options.lineWrapping)
            left = charWidth(cm.display) * pos.ch;
        let lineObj = utils_line.getLine(cm.doc, pos.line);
        let top = spans.heightAtLine(lineObj) + paddingTop(cm.display);
        return {
            left: left,
            right: left,
            top: top,
            bottom: top + lineObj.height
        };
    }
    function PosWithInfo(line, ch, sticky, outside, xRel) {
        let pos = line_pos.Pos(line, ch, sticky);
        pos.xRel = xRel;
        if (outside)
            pos.outside = true;
        return pos;
    }
    function coordsChar(cm, x, y) {
        let doc = cm.doc;
        y += cm.display.viewOffset;
        if (y < 0)
            return PosWithInfo(doc.first, 0, null, true, -1);
        let lineN = utils_line.lineAtHeight(doc, y), last = doc.first + doc.size - 1;
        if (lineN > last)
            return PosWithInfo(doc.first + doc.size - 1, utils_line.getLine(doc, last).text.length, null, true, 1);
        if (x < 0)
            x = 0;
        let lineObj = utils_line.getLine(doc, lineN);
        for (;;) {
            let found = coordsCharInner(cm, lineObj, lineN, x, y);
            let collapsed = spans.collapsedSpanAround(lineObj, found.ch + (found.xRel > 0 ? 1 : 0));
            if (!collapsed)
                return found;
            let rangeEnd = collapsed.find(1);
            if (rangeEnd.line == lineN)
                return rangeEnd;
            lineObj = utils_line.getLine(doc, lineN = rangeEnd.line);
        }
    }
    function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
        y -= widgetTopHeight(lineObj);
        let end = lineObj.text.length;
        let begin = misc.findFirst(ch => measureCharPrepared(cm, preparedMeasure, ch - 1).bottom <= y, end, 0);
        end = misc.findFirst(ch => measureCharPrepared(cm, preparedMeasure, ch).top > y, begin, end);
        return {
            begin,
            end
        };
    }
    function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
        if (!preparedMeasure)
            preparedMeasure = prepareMeasureForLine(cm, lineObj);
        let targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), 'line').top;
        return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop);
    }
    function boxIsAfter(box, x, y, left) {
        return box.bottom <= y ? false : box.top > y ? true : (left ? box.left : box.right) > x;
    }
    function coordsCharInner(cm, lineObj, lineNo, x, y) {
        y -= spans.heightAtLine(lineObj);
        let preparedMeasure = prepareMeasureForLine(cm, lineObj);
        let widgetHeight = widgetTopHeight(lineObj);
        let begin = 0, end = lineObj.text.length, ltr = true;
        let order = bidi.getOrder(lineObj, cm.doc.direction);
        if (order) {
            let part = (cm.options.lineWrapping ? coordsBidiPartWrapped : coordsBidiPart)(cm, lineObj, lineNo, preparedMeasure, order, x, y);
            ltr = part.level != 1;
            begin = ltr ? part.from : part.to - 1;
            end = ltr ? part.to : part.from - 1;
        }
        let chAround = null, boxAround = null;
        let ch = misc.findFirst(ch => {
            let box = measureCharPrepared(cm, preparedMeasure, ch);
            box.top += widgetHeight;
            box.bottom += widgetHeight;
            if (!boxIsAfter(box, x, y, false))
                return false;
            if (box.top <= y && box.left <= x) {
                chAround = ch;
                boxAround = box;
            }
            return true;
        }, begin, end);
        let baseX, sticky, outside = false;
        if (boxAround) {
            let atLeft = x - boxAround.left < boxAround.right - x, atStart = atLeft == ltr;
            ch = chAround + (atStart ? 0 : 1);
            sticky = atStart ? 'after' : 'before';
            baseX = atLeft ? boxAround.left : boxAround.right;
        } else {
            if (!ltr && (ch == end || ch == begin))
                ch++;
            sticky = ch == 0 ? 'after' : ch == lineObj.text.length ? 'before' : measureCharPrepared(cm, preparedMeasure, ch - (ltr ? 1 : 0)).bottom + widgets.widgetHeight <= y == ltr ? 'after' : 'before';
            let coords = cursorCoords(cm, line_pos.Pos(lineNo, ch, sticky), 'line', lineObj, preparedMeasure);
            baseX = coords.left;
            outside = y < coords.top || y >= coords.bottom;
        }
        ch = misc.skipExtendingChars(lineObj.text, ch, 1);
        return PosWithInfo(lineNo, ch, sticky, outside, x - baseX);
    }
    function coordsBidiPart(cm, lineObj, lineNo, preparedMeasure, order, x, y) {
        let index = misc.findFirst(i => {
            let part = order[i], ltr = part.level != 1;
            return boxIsAfter(cursorCoords(cm, line_pos.Pos(lineNo, ltr ? part.to : part.from, ltr ? 'before' : 'after'), 'line', lineObj, preparedMeasure), x, y, true);
        }, 0, order.length - 1);
        let part = order[index];
        if (index > 0) {
            let ltr = part.level != 1;
            let start = cursorCoords(cm, line_pos.Pos(lineNo, ltr ? part.from : part.to, ltr ? 'after' : 'before'), 'line', lineObj, preparedMeasure);
            if (boxIsAfter(start, x, y, true) && start.top > y)
                part = order[index - 1];
        }
        return part;
    }
    function coordsBidiPartWrapped(cm, lineObj, _lineNo, preparedMeasure, order, x, y) {
        let {begin, end} = wrappedLineExtent(cm, lineObj, preparedMeasure, y);
        if (/\s/.test(lineObj.text.charAt(end - 1)))
            end--;
        let part = null, closestDist = null;
        for (let i = 0; i < order.length; i++) {
            let p = order[i];
            if (p.from >= end || p.to <= begin)
                continue;
            let ltr = p.level != 1;
            let endX = measureCharPrepared(cm, preparedMeasure, ltr ? Math.min(end, p.to) - 1 : Math.max(begin, p.from)).right;
            let dist = endX < x ? x - endX + 1000000000 : endX - x;
            if (!part || closestDist > dist) {
                part = p;
                closestDist = dist;
            }
        }
        if (!part)
            part = order[order.length - 1];
        if (part.from < begin)
            part = {
                from: begin,
                to: part.to,
                level: part.level
            };
        if (part.to > end)
            part = {
                from: part.from,
                to: end,
                level: part.level
            };
        return part;
    }
    let measureText;
    function textHeight(display) {
        if (display.cachedTextHeight != null)
            return display.cachedTextHeight;
        if (measureText == null) {
            measureText = dom.elt('pre');
            for (let i = 0; i < 49; ++i) {
                measureText.appendChild(document.createTextNode('x'));
                measureText.appendChild(dom.elt('br'));
            }
            measureText.appendChild(document.createTextNode('x'));
        }
        dom.removeChildrenAndAdd(display.measure, measureText);
        let height = measureText.offsetHeight / 50;
        if (height > 3)
            display.cachedTextHeight = height;
        dom.removeChildren(display.measure);
        return height || 1;
    }
    function charWidth(display) {
        if (display.cachedCharWidth != null)
            return display.cachedCharWidth;
        let anchor = dom.elt('span', 'xxxxxxxxxx');
        let pre = dom.elt('pre', [anchor]);
        dom.removeChildrenAndAdd(display.measure, pre);
        let rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
        if (width > 2)
            display.cachedCharWidth = width;
        return width || 10;
    }
    function getDimensions(cm) {
        let utils_line = cm.display, left = {}, width = {};
        let gutterLeft = utils_line.gutters.clientLeft;
        for (let n = utils_line.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
            left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft;
            width[cm.options.gutters[i]] = n.clientWidth;
        }
        return {
            fixedPos: compensateForHScroll(utils_line),
            gutterTotalWidth: utils_line.gutters.offsetWidth,
            gutterLeft: left,
            gutterWidth: width,
            wrapperWidth: utils_line.wrapper.clientWidth
        };
    }
    function compensateForHScroll(display) {
        return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;
    }
    function estimateHeight(cm) {
        let th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
        let perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
        return line => {
            if (spans.lineIsHidden(cm.doc, line))
                return 0;
            let widgetsHeight = 0;
            if (line.widgets)
                for (let i = 0; i < line.widgets.length; i++) {
                    if (line.widgets[i].height)
                        widgetsHeight += line.widgets[i].height;
                }
            if (wrapping)
                return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;
            else
                return widgetsHeight + th;
        };
    }
    function estimateLineHeights(cm) {
        let doc = cm.doc, est = estimateHeight(cm);
        doc.iter(line => {
            let estHeight = est(line);
            if (estHeight != line.height)
                utils_line.updateLineHeight(line, estHeight);
        });
    }
    function posFromMouse(cm, e, liberal, forRect) {
        let display = cm.display;
        if (!liberal && events.e_target(e).getAttribute('cm-not-content') == 'true')
            return null;
        let x, y, space = display.lineSpace.getBoundingClientRect();
        try {
            x = e.clientX - space.left;
            y = e.clientY - space.top;
        } catch (e) {
            return null;
        }
        let coords = coordsChar(cm, x, y), line;
        if (forRect && coords.xRel == 1 && (line = utils_line.getLine(cm.doc, coords.line).text).length == coords.ch) {
            let colDiff = misc.countColumn(line, line.length, cm.options.tabSize) - line.length;
            coords = line_pos.Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
        }
        return coords;
    }
    function findViewIndex(cm, n) {
        if (n >= cm.display.viewTo)
            return null;
        n -= cm.display.viewFrom;
        if (n < 0)
            return null;
        let view = cm.display.view;
        for (let i = 0; i < view.length; i++) {
            n -= view[i].size;
            if (n < 0)
                return i;
        }
    }
    return {
        paddingTop: paddingTop,
        paddingVert: paddingVert,
        paddingH: paddingH,
        scrollGap: scrollGap,
        displayWidth: displayWidth,
        displayHeight: displayHeight,
        mapFromLineView: mapFromLineView,
        measureChar: measureChar,
        findViewForLine: findViewForLine,
        prepareMeasureForLine: prepareMeasureForLine,
        measureCharPrepared: measureCharPrepared,
        nodeAndOffsetInLineMap: nodeAndOffsetInLineMap,
        clearLineMeasurementCacheFor: clearLineMeasurementCacheFor,
        clearLineMeasurementCache: clearLineMeasurementCache,
        clearCaches: clearCaches,
        intoCoordSystem: intoCoordSystem,
        fromCoordSystem: fromCoordSystem,
        charCoords: charCoords,
        cursorCoords: cursorCoords,
        estimateCoords: estimateCoords,
        coordsChar: coordsChar,
        wrappedLineExtentChar: wrappedLineExtentChar,
        textHeight: textHeight,
        charWidth: charWidth,
        getDimensions: getDimensions,
        compensateForHScroll: compensateForHScroll,
        estimateHeight: estimateHeight,
        estimateLineHeights: estimateLineHeights,
        posFromMouse: posFromMouse,
        findViewIndex: findViewIndex
    };
});
define('skylark-codemirror/primitives/display/selection',[
    '../line/pos',
    '../line/spans',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../util/bidi',
    '../util/dom'
], function (a, b, c, d, e, f) {
    'use strict';
    function updateSelection(cm) {
        cm.display.input.showSelection(cm.display.input.prepareSelection());
    }
    function prepareSelection(cm, primary = true) {
        let doc = cm.doc, result = {};
        let curFragment = result.cursors = document.createDocumentFragment();
        let selFragment = result.selection = document.createDocumentFragment();
        for (let i = 0; i < doc.sel.ranges.length; i++) {
            if (!primary && i == doc.sel.primIndex)
                continue;
            let range = doc.sel.ranges[i];
            if (range.from().line >= cm.display.viewTo || range.to().line < cm.display.viewFrom)
                continue;
            let collapsed = range.empty();
            if (collapsed || cm.options.showCursorWhenSelecting)
                drawSelectionCursor(cm, range.head, curFragment);
            if (!collapsed)
                drawSelectionRange(cm, range, selFragment);
        }
        return result;
    }
    function drawSelectionCursor(cm, head, output) {
        let pos = d.cursorCoords(cm, head, 'div', null, null, !cm.options.singleCursorHeightPerLine);
        let cursor = output.appendChild(f.elt('div', '\xA0', 'CodeMirror-cursor'));
        cursor.style.left = pos.left + 'px';
        cursor.style.top = pos.top + 'px';
        cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + 'px';
        if (pos.other) {
            let otherCursor = output.appendChild(f.elt('div', '\xA0', 'CodeMirror-cursor CodeMirror-secondarycursor'));
            otherCursor.style.display = '';
            otherCursor.style.left = pos.other.left + 'px';
            otherCursor.style.top = pos.other.top + 'px';
            otherCursor.style.height = (pos.other.bottom - pos.other.top) * 0.85 + 'px';
        }
    }
    function cmpCoords(a, b) {
        return a.top - b.top || a.left - b.left;
    }
    function drawSelectionRange(cm, range, output) {
        let display = cm.display, doc = cm.doc;
        let fragment = document.createDocumentFragment();
        let padding = d.paddingH(cm.display), leftSide = padding.left;
        let rightSide = Math.max(display.sizerWidth, d.displayWidth(cm) - display.sizer.offsetLeft) - padding.right;
        let docLTR = doc.direction == 'ltr';
        function add(left, top, width, bottom) {
            if (top < 0)
                top = 0;
            top = Math.round(top);
            bottom = Math.round(bottom);
            fragment.appendChild(f.elt('div', null, 'CodeMirror-selected', `position: absolute; left: ${ left }px;
                             top: ${ top }px; width: ${ width == null ? rightSide - left : width }px;
                             height: ${ bottom - top }px`));
        }
        function drawForLine(line, fromArg, toArg) {
            let lineObj = c.getLine(doc, line);
            let lineLen = lineObj.text.length;
            let start, end;
            function coords(ch, bias) {
                return d.charCoords(cm, a.Pos(line, ch), 'div', lineObj, bias);
            }
            function wrapX(pos, dir, side) {
                let extent = d.wrappedLineExtentChar(cm, lineObj, null, pos);
                let prop = dir == 'ltr' == (side == 'after') ? 'left' : 'right';
                let ch = side == 'after' ? extent.begin : extent.end - (/\s/.test(lineObj.text.charAt(extent.end - 1)) ? 2 : 1);
                return coords(ch, prop)[prop];
            }
            let order = e.getOrder(lineObj, doc.direction);
            e.iterateBidiSections(order, fromArg || 0, toArg == null ? lineLen : toArg, (from, to, dir, i) => {
                let ltr = dir == 'ltr';
                let fromPos = coords(from, ltr ? 'left' : 'right');
                let toPos = coords(to - 1, ltr ? 'right' : 'left');
                let openStart = fromArg == null && from == 0, openEnd = toArg == null && to == lineLen;
                let first = i == 0, last = !order || i == order.length - 1;
                if (toPos.top - fromPos.top <= 3) {
                    let openLeft = (docLTR ? openStart : openEnd) && first;
                    let openRight = (docLTR ? openEnd : openStart) && last;
                    let left = openLeft ? leftSide : (ltr ? fromPos : toPos).left;
                    let right = openRight ? rightSide : (ltr ? toPos : fromPos).right;
                    add(left, fromPos.top, right - left, fromPos.bottom);
                } else {
                    let topLeft, topRight, botLeft, botRight;
                    if (ltr) {
                        topLeft = docLTR && openStart && first ? leftSide : fromPos.left;
                        topRight = docLTR ? rightSide : wrapX(from, dir, 'before');
                        botLeft = docLTR ? leftSide : wrapX(to, dir, 'after');
                        botRight = docLTR && openEnd && last ? rightSide : toPos.right;
                    } else {
                        topLeft = !docLTR ? leftSide : wrapX(from, dir, 'before');
                        topRight = !docLTR && openStart && first ? rightSide : fromPos.right;
                        botLeft = !docLTR && openEnd && last ? leftSide : toPos.left;
                        botRight = !docLTR ? rightSide : wrapX(to, dir, 'after');
                    }
                    add(topLeft, fromPos.top, topRight - topLeft, fromPos.bottom);
                    if (fromPos.bottom < toPos.top)
                        add(leftSide, fromPos.bottom, null, toPos.top);
                    add(botLeft, toPos.top, botRight - botLeft, toPos.bottom);
                }
                if (!start || cmpCoords(fromPos, start) < 0)
                    start = fromPos;
                if (cmpCoords(toPos, start) < 0)
                    start = toPos;
                if (!end || cmpCoords(fromPos, end) < 0)
                    end = fromPos;
                if (cmpCoords(toPos, end) < 0)
                    end = toPos;
            });
            return {
                start: start,
                end: end
            };
        }
        let sFrom = range.from(), sTo = range.to();
        if (sFrom.line == sTo.line) {
            drawForLine(sFrom.line, sFrom.ch, sTo.ch);
        } else {
            let fromLine = c.getLine(doc, sFrom.line), toLine = c.getLine(doc, sTo.line);
            let singleVLine = b.visualLine(fromLine) == b.visualLine(toLine);
            let leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
            let rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
            if (singleVLine) {
                if (leftEnd.top < rightStart.top - 2) {
                    add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
                    add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
                } else {
                    add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
                }
            }
            if (leftEnd.bottom < rightStart.top)
                add(leftSide, leftEnd.bottom, null, rightStart.top);
        }
        output.appendChild(fragment);
    }
    function restartBlink(cm) {
        if (!cm.state.focused)
            return;
        let display = cm.display;
        clearInterval(display.blinker);
        let on = true;
        display.cursorDiv.style.visibility = '';
        if (cm.options.cursorBlinkRate > 0)
            display.blinker = setInterval(() => display.cursorDiv.style.visibility = (on = !on) ? '' : 'hidden', cm.options.cursorBlinkRate);
        else if (cm.options.cursorBlinkRate < 0)
            display.cursorDiv.style.visibility = 'hidden';
    }
    return {
        updateSelection: updateSelection,
        prepareSelection: prepareSelection,
        drawSelectionCursor: drawSelectionCursor,
        restartBlink: restartBlink
    };
});
define('skylark-codemirror/primitives/display/focus',[
    './selection',
    '../util/browser',
    '../util/dom',
    '../util/event'
], function (selection, browser, dom, event) {
    'use strict';
    function ensureFocus(cm) {
        if (!cm.state.focused) {
            cm.display.input.focus();
            onFocus(cm);
        }
    }
    function delayBlurEvent(cm) {
        cm.state.delayingBlurEvent = true;
        setTimeout(() => {
            if (cm.state.delayingBlurEvent) {
                cm.state.delayingBlurEvent = false;
                onBlur(cm);
            }
        }, 100);
    }
    function onFocus(cm, e) {
        if (cm.state.delayingBlurEvent)
            cm.state.delayingBlurEvent = false;
        if (cm.options.readOnly == 'nocursor')
            return;
        if (!cm.state.focused) {
            event.signal(cm, 'focus', cm, e);
            cm.state.focused = true;
            dom.addClass(cm.display.wrapper, 'CodeMirror-focused');
            if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
                cm.display.input.reset();
                if (browser.webkit)
                    setTimeout(() => cm.display.input.reset(true), 20);
            }
            cm.display.input.receivedFocus();
        }
        selection.restartBlink(cm);
    }
    function onBlur(cm, e) {
        if (cm.state.delayingBlurEvent)
            return;
        if (cm.state.focused) {
            event.signal(cm, 'blur', cm, e);
            cm.state.focused = false;
            dom.rmClass(cm.display.wrapper, 'CodeMirror-focused');
        }
        clearInterval(cm.display.blinker);
        setTimeout(() => {
            if (!cm.state.focused)
                cm.display.shift = false;
        }, 150);
    }
    return {
        ensureFocus: ensureFocus,
        delayBlurEvent: delayBlurEvent,
        onFocus: onFocus,
        onBlur: onBlur
    };
});
define('skylark-codemirror/primitives/display/update_lines',[
    '../line/spans',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../util/browser'
], function (a, b, c, d) {
    'use strict';
    function updateHeightsInViewport(cm) {
        let display = cm.display;
        let prevBottom = display.lineDiv.offsetTop;
        for (let i = 0; i < display.view.length; i++) {
            let cur = display.view[i], wrapping = cm.options.lineWrapping;
            let height, width = 0;
            if (cur.hidden)
                continue;
            if (d.ie && d.ie_version < 8) {
                let bot = cur.node.offsetTop + cur.node.offsetHeight;
                height = bot - prevBottom;
                prevBottom = bot;
            } else {
                let box = cur.node.getBoundingClientRect();
                height = box.bottom - box.top;
                if (!wrapping && cur.text.firstChild)
                    width = cur.text.firstChild.getBoundingClientRect().right - box.left - 1;
            }
            let diff = cur.line.height - height;
            if (diff > 0.005 || diff < -0.005) {
                b.updateLineHeight(cur.line, height);
                updateWidgetHeight(cur.line);
                if (cur.rest)
                    for (let j = 0; j < cur.rest.length; j++)
                        updateWidgetHeight(cur.rest[j]);
            }
            if (width > cm.display.sizerWidth) {
                let chWidth = Math.ceil(width / c.charWidth(cm.display));
                if (chWidth > cm.display.maxLineLength) {
                    cm.display.maxLineLength = chWidth;
                    cm.display.maxLine = cur.line;
                    cm.display.maxLineChanged = true;
                }
            }
        }
    }
    function updateWidgetHeight(line) {
        if (line.widgets)
            for (let i = 0; i < line.widgets.length; ++i) {
                let w = line.widgets[i], parent = w.node.parentNode;
                if (parent)
                    w.height = parent.offsetHeight;
            }
    }
    function visibleLines(display, doc, viewport) {
        let top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
        top = Math.floor(top - c.paddingTop(display));
        let bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;
        let from = b.lineAtHeight(doc, top), to = b.lineAtHeight(doc, bottom);
        if (viewport && viewport.ensure) {
            let ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
            if (ensureFrom < from) {
                from = ensureFrom;
                to = b.lineAtHeight(doc, a.heightAtLine(b.getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
            } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
                from = b.lineAtHeight(doc, a.heightAtLine(b.getLine(doc, ensureTo)) - display.wrapper.clientHeight);
                to = ensureTo;
            }
        }
        return {
            from: from,
            to: Math.max(to, from + 1)
        };
    }
    return {
        updateHeightsInViewport: updateHeightsInViewport,
        visibleLines: visibleLines
    };
});
define('skylark-codemirror/primitives/display/view_tracking',[
    '../line/line_data',
    '../line/saw_special_spans',
    '../line/spans',
    '../measurement/position_measurement',
    '../util/misc'
], function (a, b, c, d, e) {
    'use strict';
    function regChange(cm, from, to, lendiff) {
        if (from == null)
            from = cm.doc.first;
        if (to == null)
            to = cm.doc.first + cm.doc.size;
        if (!lendiff)
            lendiff = 0;
        let display = cm.display;
        if (lendiff && to < display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers > from))
            display.updateLineNumbers = from;
        cm.curOp.viewChanged = true;
        if (from >= display.viewTo) {
            if (b.sawCollapsedSpans && c.visualLineNo(cm.doc, from) < display.viewTo)
                resetView(cm);
        } else if (to <= display.viewFrom) {
            if (b.sawCollapsedSpans && c.visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
                resetView(cm);
            } else {
                display.viewFrom += lendiff;
                display.viewTo += lendiff;
            }
        } else if (from <= display.viewFrom && to >= display.viewTo) {
            resetView(cm);
        } else if (from <= display.viewFrom) {
            let cut = viewCuttingPoint(cm, to, to + lendiff, 1);
            if (cut) {
                display.view = display.view.slice(cut.index);
                display.viewFrom = cut.lineN;
                display.viewTo += lendiff;
            } else {
                resetView(cm);
            }
        } else if (to >= display.viewTo) {
            let cut = viewCuttingPoint(cm, from, from, -1);
            if (cut) {
                display.view = display.view.slice(0, cut.index);
                display.viewTo = cut.lineN;
            } else {
                resetView(cm);
            }
        } else {
            let cutTop = viewCuttingPoint(cm, from, from, -1);
            let cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
            if (cutTop && cutBot) {
                display.view = display.view.slice(0, cutTop.index).concat(a.buildViewArray(cm, cutTop.lineN, cutBot.lineN)).concat(display.view.slice(cutBot.index));
                display.viewTo += lendiff;
            } else {
                resetView(cm);
            }
        }
        let ext = display.externalMeasured;
        if (ext) {
            if (to < ext.lineN)
                ext.lineN += lendiff;
            else if (from < ext.lineN + ext.size)
                display.externalMeasured = null;
        }
    }
    function regLineChange(cm, line, type) {
        cm.curOp.viewChanged = true;
        let display = cm.display, ext = cm.display.externalMeasured;
        if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
            display.externalMeasured = null;
        if (line < display.viewFrom || line >= display.viewTo)
            return;
        let lineView = display.view[d.findViewIndex(cm, line)];
        if (lineView.node == null)
            return;
        let arr = lineView.changes || (lineView.changes = []);
        if (e.indexOf(arr, type) == -1)
            arr.push(type);
    }
    function resetView(cm) {
        cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
        cm.display.view = [];
        cm.display.viewOffset = 0;
    }
    function viewCuttingPoint(cm, oldN, newN, dir) {
        let index = d.findViewIndex(cm, oldN), diff, view = cm.display.view;
        if (!b.sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
            return {
                index: index,
                lineN: newN
            };
        let n = cm.display.viewFrom;
        for (let i = 0; i < index; i++)
            n += view[i].size;
        if (n != oldN) {
            if (dir > 0) {
                if (index == view.length - 1)
                    return null;
                diff = n + view[index].size - oldN;
                index++;
            } else {
                diff = n - oldN;
            }
            oldN += diff;
            newN += diff;
        }
        while (c.visualLineNo(cm.doc, newN) != newN) {
            if (index == (dir < 0 ? 0 : view.length - 1))
                return null;
            newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
            index += dir;
        }
        return {
            index: index,
            lineN: newN
        };
    }
    function adjustView(cm, from, to) {
        let display = cm.display, view = display.view;
        if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
            display.view = a.buildViewArray(cm, from, to);
            display.viewFrom = from;
        } else {
            if (display.viewFrom > from)
                display.view = a.buildViewArray(cm, from, display.viewFrom).concat(display.view);
            else if (display.viewFrom < from)
                display.view = display.view.slice(d.findViewIndex(cm, from));
            display.viewFrom = from;
            if (display.viewTo < to)
                display.view = display.view.concat(a.buildViewArray(cm, display.viewTo, to));
            else if (display.viewTo > to)
                display.view = display.view.slice(0, d.findViewIndex(cm, to));
        }
        display.viewTo = to;
    }
    function countDirtyView(cm) {
        let view = cm.display.view, dirty = 0;
        for (let i = 0; i < view.length; i++) {
            let lineView = view[i];
            if (!lineView.hidden && (!lineView.node || lineView.changes))
                ++dirty;
        }
        return dirty;
    }
    return {
        regChange: regChange,
        regLineChange: regLineChange,
        resetView: resetView,
        adjustView: adjustView,
        countDirtyView: countDirtyView
    };
});
define('skylark-codemirror/primitives/display/update_display',[
    '../line/saw_special_spans',
    '../line/spans',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/misc',
    './update_line',
//    './highlight_worker', // dependence cycle 
//    './line_numbers',
//    './scrollbars',
    './selection',
    './update_lines',
    './view_tracking'
], function (
    a, 
    b, 
    c, 
    d, 
    e, 
    f, 
    g, 
    h, 
    m_update_line, 
//    j, 
//    k, 
//    l, 
    m, 
    n, 
    o
) {
    'use strict';
    class DisplayUpdate {
        constructor(cm, viewport, force) {
            let display = cm.display;
            this.viewport = viewport;
            this.visible = n.visibleLines(display, cm.doc, viewport);
            this.editorIsHidden = !display.wrapper.offsetWidth;
            this.wrapperHeight = display.wrapper.clientHeight;
            this.wrapperWidth = display.wrapper.clientWidth;
            this.oldDisplayWidth = d.displayWidth(cm);
            this.force = force;
            this.dims = d.getDimensions(cm);
            this.events = [];
        }
        signal(emitter, type) {
            if (g.hasHandler(emitter, type))
                this.events.push(arguments);
        }
        finish() {
            for (let i = 0; i < this.events.length; i++)
                g.signal.apply(null, this.events[i]);
        }
    }
    function maybeClipScrollbars(cm) {
        let display = cm.display;
        if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
            display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
            display.heightForcer.style.height = d.scrollGap(cm) + 'px';
            display.sizer.style.marginBottom = -display.nativeBarWidth + 'px';
            display.sizer.style.borderRightWidth = d.scrollGap(cm) + 'px';
            display.scrollbarsClipped = true;
        }
    }
    function selectionSnapshot(cm) {
        if (cm.hasFocus())
            return null;
        let active = f.activeElt();
        if (!active || !f.contains(cm.display.lineDiv, active))
            return null;
        let result = { activeElt: active };
        if (window.getSelection) {
            let sel = window.getSelection();
            if (sel.anchorNode && sel.extend && f.contains(cm.display.lineDiv, sel.anchorNode)) {
                result.anchorNode = sel.anchorNode;
                result.anchorOffset = sel.anchorOffset;
                result.focusNode = sel.focusNode;
                result.focusOffset = sel.focusOffset;
            }
        }
        return result;
    }
    function restoreSelection(snapshot) {
        if (!snapshot || !snapshot.activeElt || snapshot.activeElt == f.activeElt())
            return;
        snapshot.activeElt.focus();
        if (snapshot.anchorNode && f.contains(document.body, snapshot.anchorNode) && f.contains(document.body, snapshot.focusNode)) {
            let sel = window.getSelection(), range = document.createRange();
            range.setEnd(snapshot.anchorNode, snapshot.anchorOffset);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            sel.extend(snapshot.focusNode, snapshot.focusOffset);
        }
    }
    function updateDisplayIfNeeded(cm, update) {
        let display = cm.display, doc = cm.doc;
        if (update.editorIsHidden) {
            o.resetView(cm);
            return false;
        }
        if (!update.force && update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) && display.renderedView == display.view && o.countDirtyView(cm) == 0)
            return false;
        if (cm.maybeUpdateLineNumberWidth()) { //if (k.maybeUpdateLineNumberWidth(cm)) {
            o.resetView(cm);
            update.dims = d.getDimensions(cm);
        }
        let end = doc.first + doc.size;
        let from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
        let to = Math.min(end, update.visible.to + cm.options.viewportMargin);
        if (display.viewFrom < from && from - display.viewFrom < 20)
            from = Math.max(doc.first, display.viewFrom);
        if (display.viewTo > to && display.viewTo - to < 20)
            to = Math.min(end, display.viewTo);
        if (a.sawCollapsedSpans) {
            from = b.visualLineNo(cm.doc, from);
            to = b.visualLineEndNo(cm.doc, to);
        }
        let different = from != display.viewFrom || to != display.viewTo || display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
        o.adjustView(cm, from, to);
        display.viewOffset = b.heightAtLine(c.getLine(cm.doc, display.viewFrom));
        cm.display.mover.style.top = display.viewOffset + 'px';
        let toUpdate = o.countDirtyView(cm);
        if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view && (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
            return false;
        let selSnapshot = selectionSnapshot(cm);
        if (toUpdate > 4)
            display.lineDiv.style.display = 'none';
        patchDisplay(cm, display.updateLineNumbers, update.dims);
        if (toUpdate > 4)
            display.lineDiv.style.display = '';
        display.renderedView = display.view;
        restoreSelection(selSnapshot);
        f.removeChildren(display.cursorDiv);
        f.removeChildren(display.selectionDiv);
        display.gutters.style.height = display.sizer.style.minHeight = 0;
        if (different) {
            display.lastWrapHeight = update.wrapperHeight;
            display.lastWrapWidth = update.wrapperWidth;
            cm.startWorker(400); // j.startWorker(cm, 400);
        }
        display.updateLineNumbers = null;
        return true;
    }
    function postUpdateDisplay(cm, update) {
        let viewport = update.viewport;
        for (let first = true;; first = false) {
            if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == d.displayWidth(cm)) {
                if (viewport && viewport.top != null)
                    viewport = { top: Math.min(cm.doc.height + d.paddingVert(cm.display) - d.displayHeight(cm), viewport.top) };
                update.visible = n.visibleLines(cm.display, cm.doc, viewport);
                if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
                    break;
            }
            if (!updateDisplayIfNeeded(cm, update))
                break;
            n.updateHeightsInViewport(cm);
            let barMeasure = cm.measureForScrollbars(); //l.measureForScrollbars(cm);
            m.updateSelection(cm);
            cm.updateScrollbars(barMeasure); //l.updateScrollbars(cm, barMeasure);
            setDocumentHeight(cm, barMeasure);
            update.force = false;
        }
        update.signal(cm, 'update', cm);
        if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
            update.signal(cm, 'viewportChange', cm, cm.display.viewFrom, cm.display.viewTo);
            cm.display.reportedViewFrom = cm.display.viewFrom;
            cm.display.reportedViewTo = cm.display.viewTo;
        }
    }
    function updateDisplaySimple(cm, viewport) {
        let update = new DisplayUpdate(cm, viewport);
        if (updateDisplayIfNeeded(cm, update)) {
            n.updateHeightsInViewport(cm);
            postUpdateDisplay(cm, update);
            let barMeasure = cm.measureForScrollbars(); //l.measureForScrollbars(cm);
            m.updateSelection(cm);
            cm.updateScrollbars(barMeasure); // l.updateScrollbars(cm, barMeasure);
            setDocumentHeight(cm, barMeasure);
            update.finish();
        }
    }
    function patchDisplay(cm, updateNumbersFrom, dims) {
        let display = cm.display, lineNumbers = cm.options.lineNumbers;
        let container = display.lineDiv, cur = container.firstChild;
        function rm(node) {
            let next = node.nextSibling;
            if (e.webkit && e.mac && cm.display.currentWheelTarget == node)
                node.style.display = 'none';
            else
                node.parentNode.removeChild(node);
            return next;
        }
        let view = display.view, lineN = display.viewFrom;
        for (let i = 0; i < view.length; i++) {
            let lineView = view[i];
            if (lineView.hidden) {
            } else if (!lineView.node || lineView.node.parentNode != container) {
                let node = m_update_line.buildLineElement(cm, lineView, lineN, dims);
                container.insertBefore(node, cur);
            } else {
                while (cur != lineView.node)
                    cur = rm(cur);
                let updateNumber = lineNumbers && updateNumbersFrom != null && updateNumbersFrom <= lineN && lineView.lineNumber;
                if (lineView.changes) {
                    if (h.indexOf(lineView.changes, 'gutter') > -1)
                        updateNumber = false;
                    m_update_line.updateLineForChanges(cm, lineView, lineN, dims);
                }
                if (updateNumber) {
                    f.removeChildren(lineView.lineNumber);
                    lineView.lineNumber.appendChild(document.createTextNode(c.lineNumberFor(cm.options, lineN)));
                }
                cur = lineView.node.nextSibling;
            }
            lineN += lineView.size;
        }
        while (cur)
            cur = rm(cur);
    }
    function updateGutterSpace(cm) {
        let width = cm.display.gutters.offsetWidth;
        cm.display.sizer.style.marginLeft = width + 'px';
    }
    function setDocumentHeight(cm, measure) {
        cm.display.sizer.style.minHeight = measure.docHeight + 'px';
        cm.display.heightForcer.style.top = measure.docHeight + 'px';
        cm.display.gutters.style.height = measure.docHeight + cm.display.barHeight + d.scrollGap(cm) + 'px';
    }
    return {
        DisplayUpdate: DisplayUpdate,
        maybeClipScrollbars: maybeClipScrollbars,
        updateDisplayIfNeeded: updateDisplayIfNeeded,
        postUpdateDisplay: postUpdateDisplay,
        updateDisplaySimple: updateDisplaySimple,
        updateGutterSpace: updateGutterSpace,
        setDocumentHeight: setDocumentHeight
    };
});
define('skylark-codemirror/primitives/display/gutters',[
    '../util/dom',
    '../util/misc',
    './update_display'
], function (dom, misc, update_display) {
    'use strict';
    function updateGutters(cm) {
        let gutters = cm.display.gutters, specs = cm.options.gutters;
        dom.removeChildren(gutters);
        let i = 0;
        for (; i < specs.length; ++i) {
            let gutterClass = specs[i];
            let gElt = gutters.appendChild(dom.elt('div', null, 'CodeMirror-gutter ' + gutterClass));
            if (gutterClass == 'CodeMirror-linenumbers') {
                cm.display.lineGutter = gElt;
                gElt.style.width = (cm.display.lineNumWidth || 1) + 'px';
            }
        }
        gutters.style.display = i ? '' : 'none';
        update_display.updateGutterSpace(cm);
    }
    function setGuttersForLineNumbers(options) {
        let found = misc.indexOf(options.gutters, 'CodeMirror-linenumbers');
        if (found == -1 && options.lineNumbers) {
            options.gutters = options.gutters.concat(['CodeMirror-linenumbers']);
        } else if (found > -1 && !options.lineNumbers) {
            options.gutters = options.gutters.slice(0);
            options.gutters.splice(found, 1);
        }
    }
    return {
        updateGutters: updateGutters,
        setGuttersForLineNumbers: setGuttersForLineNumbers
    };
});
define('skylark-codemirror/primitives/display/line_numbers',[
    '../line/utils_line',
    '../measurement/position_measurement',
    '../util/dom',
    './update_display'
], function (utils_line, position_measurement, dom, update_display) {
    'use strict';
    function alignHorizontally(cm) {
        let display = cm.display, view = display.view;
        if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter))
            return;
        let comp = position_measurement.compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
        let gutterW = display.gutters.offsetWidth, left = comp + 'px';
        for (let i = 0; i < view.length; i++)
            if (!view[i].hidden) {
                if (cm.options.fixedGutter) {
                    if (view[i].gutter)
                        view[i].gutter.style.left = left;
                    if (view[i].gutterBackground)
                        view[i].gutterBackground.style.left = left;
                }
                let align = view[i].alignable;
                if (align)
                    for (let j = 0; j < align.length; j++)
                        align[j].style.left = left;
            }
        if (cm.options.fixedGutter)
            display.gutters.style.left = comp + gutterW + 'px';
    }
    function maybeUpdateLineNumberWidth(cm) {
        if (!cm.options.lineNumbers)
            return false;
        let doc = cm.doc, last = utils_line.lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
        if (last.length != display.lineNumChars) {
            let test = display.measure.appendChild(dom.elt('div', [dom.elt('div', last)], 'CodeMirror-linenumber CodeMirror-gutter-elt'));
            let innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
            display.lineGutter.style.width = '';
            display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
            display.lineNumWidth = display.lineNumInnerWidth + padding;
            display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
            display.lineGutter.style.width = display.lineNumWidth + 'px';
            update_display.updateGutterSpace(cm);
            return true;
        }
        return false;
    }
    return {
        alignHorizontally: alignHorizontally,
        maybeUpdateLineNumberWidth: maybeUpdateLineNumberWidth
    };
});
define('skylark-codemirror/primitives/display/scrolling',[
    '../line/pos',
    '../measurement/position_measurement',
    '../util/browser',
    '../util/dom',
    '../util/event',
    //'./highlight_worker',// dependence cycle 
    './line_numbers',
    './update_display'
], function (
    a, 
    b, 
    c, 
    d, 
    e, 
//    highlight_worker, 
    g, 
    h
) {
    'use strict';
    function maybeScrollWindow(cm, rect) {
        if (e.signalDOMEvent(cm, 'scrollCursorIntoView'))
            return;
        let display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;
        if (rect.top + box.top < 0)
            doScroll = true;
        else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight))
            doScroll = false;
        if (doScroll != null && !c.phantom) {
            let scrollNode = d.elt('div', '\u200B', null, `position: absolute;
                         top: ${ rect.top - display.viewOffset - b.paddingTop(cm.display) }px;
                         height: ${ rect.bottom - rect.top + b.scrollGap(cm) + display.barHeight }px;
                         left: ${ rect.left }px; width: ${ Math.max(2, rect.right - rect.left) }px;`);
            cm.display.lineSpace.appendChild(scrollNode);
            scrollNode.scrollIntoView(doScroll);
            cm.display.lineSpace.removeChild(scrollNode);
        }
    }
    function scrollPosIntoView(cm, pos, end, margin) {
        if (margin == null)
            margin = 0;
        let rect;
        if (!cm.options.lineWrapping && pos == end) {
            pos = pos.ch ? a.Pos(pos.line, pos.sticky == 'before' ? pos.ch - 1 : pos.ch, 'after') : pos;
            end = pos.sticky == 'before' ? a.Pos(pos.line, pos.ch + 1, 'before') : pos;
        }
        for (let limit = 0; limit < 5; limit++) {
            let changed = false;
            let coords = b.cursorCoords(cm, pos);
            let endCoords = !end || end == pos ? coords : b.cursorCoords(cm, end);
            rect = {
                left: Math.min(coords.left, endCoords.left),
                top: Math.min(coords.top, endCoords.top) - margin,
                right: Math.max(coords.left, endCoords.left),
                bottom: Math.max(coords.bottom, endCoords.bottom) + margin
            };
            let scrollPos = calculateScrollPos(cm, rect);
            let startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
            if (scrollPos.scrollTop != null) {
                updateScrollTop(cm, scrollPos.scrollTop);
                if (Math.abs(cm.doc.scrollTop - startTop) > 1)
                    changed = true;
            }
            if (scrollPos.scrollLeft != null) {
                setScrollLeft(cm, scrollPos.scrollLeft);
                if (Math.abs(cm.doc.scrollLeft - startLeft) > 1)
                    changed = true;
            }
            if (!changed)
                break;
        }
        return rect;
    }
    function scrollIntoView(cm, rect) {
        let scrollPos = calculateScrollPos(cm, rect);
        if (scrollPos.scrollTop != null)
            updateScrollTop(cm, scrollPos.scrollTop);
        if (scrollPos.scrollLeft != null)
            setScrollLeft(cm, scrollPos.scrollLeft);
    }
    function calculateScrollPos(cm, rect) {
        let display = cm.display, snapMargin = b.textHeight(cm.display);
        if (rect.top < 0)
            rect.top = 0;
        let screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
        let screen = b.displayHeight(cm), result = {};
        if (rect.bottom - rect.top > screen)
            rect.bottom = rect.top + screen;
        let docBottom = cm.doc.height + b.paddingVert(display);
        let atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin;
        if (rect.top < screentop) {
            result.scrollTop = atTop ? 0 : rect.top;
        } else if (rect.bottom > screentop + screen) {
            let newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen);
            if (newTop != screentop)
                result.scrollTop = newTop;
        }
        let screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft;
        let screenw = b.displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0);
        let tooWide = rect.right - rect.left > screenw;
        if (tooWide)
            rect.right = rect.left + screenw;
        if (rect.left < 10)
            result.scrollLeft = 0;
        else if (rect.left < screenleft)
            result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10));
        else if (rect.right > screenw + screenleft - 3)
            result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw;
        return result;
    }
    function addToScrollTop(cm, top) {
        if (top == null)
            return;
        resolveScrollToPos(cm);
        cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
    }
    function ensureCursorVisible(cm) {
        resolveScrollToPos(cm);
        let cur = cm.getCursor();
        cm.curOp.scrollToPos = {
            from: cur,
            to: cur,
            margin: cm.options.cursorScrollMargin
        };
    }
    function scrollToCoords(cm, x, y) {
        if (x != null || y != null)
            resolveScrollToPos(cm);
        if (x != null)
            cm.curOp.scrollLeft = x;
        if (y != null)
            cm.curOp.scrollTop = y;
    }
    function scrollToRange(cm, range) {
        resolveScrollToPos(cm);
        cm.curOp.scrollToPos = range;
    }
    function resolveScrollToPos(cm) {
        let range = cm.curOp.scrollToPos;
        if (range) {
            cm.curOp.scrollToPos = null;
            let from = b.estimateCoords(cm, range.from), to = b.estimateCoords(cm, range.to);
            scrollToCoordsRange(cm, from, to, range.margin);
        }
    }
    function scrollToCoordsRange(cm, from, to, margin) {
        let sPos = calculateScrollPos(cm, {
            left: Math.min(from.left, to.left),
            top: Math.min(from.top, to.top) - margin,
            right: Math.max(from.right, to.right),
            bottom: Math.max(from.bottom, to.bottom) + margin
        });
        scrollToCoords(cm, sPos.scrollLeft, sPos.scrollTop);
    }
    function updateScrollTop(cm, val) {
        if (Math.abs(cm.doc.scrollTop - val) < 2)
            return;
        if (!c.gecko)
            h.updateDisplaySimple(cm, { top: val });
        setScrollTop(cm, val, true);
        if (c.gecko)
            h.updateDisplaySimple(cm);
        cm.startWorker(cm, 100); // highlight_worker.startWorker(cm, 100);
    }
    function setScrollTop(cm, val, forceScroll) {
        val = Math.min(cm.display.scroller.scrollHeight - cm.display.scroller.clientHeight, val);
        if (cm.display.scroller.scrollTop == val && !forceScroll)
            return;
        cm.doc.scrollTop = val;
        cm.display.scrollbars.setScrollTop(val);
        if (cm.display.scroller.scrollTop != val)
            cm.display.scroller.scrollTop = val;
    }
    function setScrollLeft(cm, val, isScroller, forceScroll) {
        val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
        if ((isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) && !forceScroll)
            return;
        cm.doc.scrollLeft = val;
        g.alignHorizontally(cm);
        if (cm.display.scroller.scrollLeft != val)
            cm.display.scroller.scrollLeft = val;
        cm.display.scrollbars.setScrollLeft(val);
    }
    return {
        maybeScrollWindow: maybeScrollWindow,
        scrollPosIntoView: scrollPosIntoView,
        scrollIntoView: scrollIntoView,
        addToScrollTop: addToScrollTop,
        ensureCursorVisible: ensureCursorVisible,
        scrollToCoords: scrollToCoords,
        scrollToRange: scrollToRange,
        scrollToCoordsRange: scrollToCoordsRange,
        updateScrollTop: updateScrollTop,
        setScrollTop: setScrollTop,
        setScrollLeft: setScrollLeft
    };
});
define('skylark-codemirror/primitives/display/scrollbars',[
    '../util/dom',
    '../util/event',
    '../measurement/position_measurement',
    '../util/browser',
    './update_lines',
    '../util/misc',
    './scrolling'
], function (dom, event, position_measurement, browser, update_lines, misc, scrolling) {
    'use strict';
    function measureForScrollbars(cm) {
        let d = cm.display, gutterW = d.gutters.offsetWidth;
        let docH = Math.round(cm.doc.height + position_measurement.paddingVert(cm.display));
        return {
            clientHeight: d.scroller.clientHeight,
            viewHeight: d.wrapper.clientHeight,
            scrollWidth: d.scroller.scrollWidth,
            clientWidth: d.scroller.clientWidth,
            viewWidth: d.wrapper.clientWidth,
            barLeft: cm.options.fixedGutter ? gutterW : 0,
            docHeight: docH,
            scrollHeight: docH + position_measurement.scrollGap(cm) + d.barHeight,
            nativeBarWidth: d.nativeBarWidth,
            gutterWidth: gutterW
        };
    }
    class NativeScrollbars {
        constructor(place, scroll, cm) {
            this.cm = cm;
            let vert = this.vert = dom.elt('div', [dom.elt('div', null, null, 'min-width: 1px')], 'CodeMirror-vscrollbar');
            let horiz = this.horiz = dom.elt('div', [dom.elt('div', null, null, 'height: 100%; min-height: 1px')], 'CodeMirror-hscrollbar');
            vert.tabIndex = horiz.tabIndex = -1;
            place(vert);
            place(horiz);
            event.on(vert, 'scroll', () => {
                if (vert.clientHeight)
                    scroll(vert.scrollTop, 'vertical');
            });
            event.on(horiz, 'scroll', () => {
                if (horiz.clientWidth)
                    scroll(horiz.scrollLeft, 'horizontal');
            });
            this.checkedZeroWidth = false;
            if (browser.ie && browser.ie_version < 8)
                this.horiz.style.minHeight = this.vert.style.minWidth = '18px';
        }
        update(measure) {
            let needsH = measure.scrollWidth > measure.clientWidth + 1;
            let needsV = measure.scrollHeight > measure.clientHeight + 1;
            let sWidth = measure.nativeBarWidth;
            if (needsV) {
                this.vert.style.display = 'block';
                this.vert.style.bottom = needsH ? sWidth + 'px' : '0';
                let totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
                this.vert.firstChild.style.height = Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + 'px';
            } else {
                this.vert.style.display = '';
                this.vert.firstChild.style.height = '0';
            }
            if (needsH) {
                this.horiz.style.display = 'block';
                this.horiz.style.right = needsV ? sWidth + 'px' : '0';
                this.horiz.style.left = measure.barLeft + 'px';
                let totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
                this.horiz.firstChild.style.width = Math.max(0, measure.scrollWidth - measure.clientWidth + totalWidth) + 'px';
            } else {
                this.horiz.style.display = '';
                this.horiz.firstChild.style.width = '0';
            }
            if (!this.checkedZeroWidth && measure.clientHeight > 0) {
                if (sWidth == 0)
                    this.zeroWidthHack();
                this.checkedZeroWidth = true;
            }
            return {
                right: needsV ? sWidth : 0,
                bottom: needsH ? sWidth : 0
            };
        }
        setScrollLeft(pos) {
            if (this.horiz.scrollLeft != pos)
                this.horiz.scrollLeft = pos;
            if (this.disableHoriz)
                this.enableZeroWidthBar(this.horiz, this.disableHoriz, 'horiz');
        }
        setScrollTop(pos) {
            if (this.vert.scrollTop != pos)
                this.vert.scrollTop = pos;
            if (this.disableVert)
                this.enableZeroWidthBar(this.vert, this.disableVert, 'vert');
        }
        zeroWidthHack() {
            let w = browser.mac && !browser.mac_geMountainLion ? '12px' : '18px';
            this.horiz.style.height = this.vert.style.width = w;
            this.horiz.style.pointerEvents = this.vert.style.pointerEvents = 'none';
            this.disableHoriz = new misc.Delayed();
            this.disableVert = new misc.Delayed();
        }
        enableZeroWidthBar(bar, delay, type) {
            bar.style.pointerEvents = 'auto';
            function maybeDisable() {
                let box = bar.getBoundingClientRect();
                let elt = type == 'vert' ? document.elementFromPoint(box.right - 1, (box.top + box.bottom) / 2) : document.elementFromPoint((box.right + box.left) / 2, box.bottom - 1);
                if (elt != bar)
                    bar.style.pointerEvents = 'none';
                else
                    delay.set(1000, maybeDisable);
            }
            delay.set(1000, maybeDisable);
        }
        clear() {
            let parent = this.horiz.parentNode;
            parent.removeChild(this.horiz);
            parent.removeChild(this.vert);
        }
    }
    class NullScrollbars {
        update() {
            return {
                bottom: 0,
                right: 0
            };
        }
        setScrollLeft() {
        }
        setScrollTop() {
        }
        clear() {
        }
    }
    function updateScrollbars(cm, measure) {
        if (!measure)
            measure = measureForScrollbars(cm);
        let startWidth = cm.display.barWidth, startHeight = cm.display.barHeight;
        updateScrollbarsInner(cm, measure);
        for (let i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
            if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
                update_lines.updateHeightsInViewport(cm);
            updateScrollbarsInner(cm, measureForScrollbars(cm));
            startWidth = cm.display.barWidth;
            startHeight = cm.display.barHeight;
        }
    }
    function updateScrollbarsInner(cm, measure) {
        let d = cm.display;
        let sizes = d.scrollbars.update(measure);
        d.sizer.style.paddingRight = (d.barWidth = sizes.right) + 'px';
        d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + 'px';
        d.heightForcer.style.borderBottom = sizes.bottom + 'px solid transparent';
        if (sizes.right && sizes.bottom) {
            d.scrollbarFiller.style.display = 'block';
            d.scrollbarFiller.style.height = sizes.bottom + 'px';
            d.scrollbarFiller.style.width = sizes.right + 'px';
        } else
            d.scrollbarFiller.style.display = '';
        if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
            d.gutterFiller.style.display = 'block';
            d.gutterFiller.style.height = sizes.bottom + 'px';
            d.gutterFiller.style.width = measure.gutterWidth + 'px';
        } else
            d.gutterFiller.style.display = '';
    }
    let scrollbarModel = {
        'native': NativeScrollbars,
        'null': NullScrollbars
    };
    function initScrollbars(cm) {
        if (cm.display.scrollbars) {
            cm.display.scrollbars.clear();
            if (cm.display.scrollbars.undefined)
                dom.rmClass(cm.display.wrapper, cm.display.scrollbars.undefined);
        }
        cm.display.scrollbars = new scrollbarModel[cm.options.scrollbarStyle](node => {
            cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
            event.on(node, 'mousedown', () => {
                if (cm.state.focused)
                    setTimeout(() => cm.display.input.focus(), 0);
            });
            node.setAttribute('cm-not-content', 'true');
        }, (pos, axis) => {
            if (axis == 'horizontal')
                scrolling.setScrollLeft(cm, pos);
            else
                scrolling.updateScrollTop(cm, pos);
        }, cm);
        if (cm.display.scrollbars.undefined)
            dom.addClass(cm.display.wrapper, cm.display.scrollbars.undefined);
    }
    return {
        measureForScrollbars: measureForScrollbars,
        updateScrollbars: updateScrollbars,
        scrollbarModel: scrollbarModel,
        initScrollbars: initScrollbars
    };
});
define('skylark-codemirror/primitives/display/operations',[
    '../line/pos',
    '../line/spans',
    '../measurement/position_measurement',
    '../util/event',
    '../util/dom',
    '../util/operation_group',
    './focus',
    './scrollbars',
    './selection',
    './scrolling',
    './update_display',
    './update_lines'
], function (a, b, c, d, e, f, g, h, i, j, k, l) {
    'use strict';
    let nextOpId = 0;
    function startOperation(cm) {
        cm.curOp = {
            cm: cm,
            viewChanged: false,
            startHeight: cm.doc.height,
            forceUpdate: false,
            updateInput: 0,
            typing: false,
            changeObjs: null,
            cursorActivityHandlers: null,
            cursorActivityCalled: 0,
            selectionChanged: false,
            updateMaxLine: false,
            scrollLeft: null,
            scrollTop: null,
            scrollToPos: null,
            focus: false,
            id: ++nextOpId
        };
        f.pushOperation(cm.curOp);
    }
    function endOperation(cm) {
        let op = cm.curOp;
        if (op)
            f.finishOperation(op, group => {
                for (let i = 0; i < group.ops.length; i++)
                    group.ops[i].cm.curOp = null;
                endOperations(group);
            });
    }
    function endOperations(group) {
        let ops = group.ops;
        for (let i = 0; i < ops.length; i++)
            endOperation_R1(ops[i]);
        for (let i = 0; i < ops.length; i++)
            endOperation_W1(ops[i]);
        for (let i = 0; i < ops.length; i++)
            endOperation_R2(ops[i]);
        for (let i = 0; i < ops.length; i++)
            endOperation_W2(ops[i]);
        for (let i = 0; i < ops.length; i++)
            endOperation_finish(ops[i]);
    }
    function endOperation_R1(op) {
        let cm = op.cm, display = cm.display;
        k.maybeClipScrollbars(cm);
        if (op.updateMaxLine)
            b.findMaxLine(cm);
        op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null || op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom || op.scrollToPos.to.line >= display.viewTo) || display.maxLineChanged && cm.options.lineWrapping;
        op.update = op.mustUpdate && new k.DisplayUpdate(cm, op.mustUpdate && {
            top: op.scrollTop,
            ensure: op.scrollToPos
        }, op.forceUpdate);
    }
    function endOperation_W1(op) {
        op.updatedDisplay = op.mustUpdate && k.updateDisplayIfNeeded(op.cm, op.update);
    }
    function endOperation_R2(op) {
        let cm = op.cm, display = cm.display;
        if (op.updatedDisplay)
            l.updateHeightsInViewport(cm);
        op.barMeasure = h.measureForScrollbars(cm);
        if (display.maxLineChanged && !cm.options.lineWrapping) {
            op.adjustWidthTo = c.measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
            cm.display.sizerWidth = op.adjustWidthTo;
            op.barMeasure.scrollWidth = Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + c.scrollGap(cm) + cm.display.barWidth);
            op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - c.displayWidth(cm));
        }
        if (op.updatedDisplay || op.selectionChanged)
            op.preparedSelection = display.input.prepareSelection();
    }
    function endOperation_W2(op) {
        let cm = op.cm;
        if (op.adjustWidthTo != null) {
            cm.display.sizer.style.minWidth = op.adjustWidthTo + 'px';
            if (op.maxScrollLeft < cm.doc.scrollLeft)
                j.setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true);
            cm.display.maxLineChanged = false;
        }
        let takeFocus = op.focus && op.focus == e.activeElt();
        if (op.preparedSelection)
            cm.display.input.showSelection(op.preparedSelection, takeFocus);
        if (op.updatedDisplay || op.startHeight != cm.doc.height)
            h.updateScrollbars(cm, op.barMeasure);
        if (op.updatedDisplay)
            k.setDocumentHeight(cm, op.barMeasure);
        if (op.selectionChanged)
            i.restartBlink(cm);
        if (cm.state.focused && op.updateInput)
            cm.display.input.reset(op.typing);
        if (takeFocus)
            g.ensureFocus(op.cm);
    }
    function endOperation_finish(op) {
        let cm = op.cm, display = cm.display, doc = cm.doc;
        if (op.updatedDisplay)
            k.postUpdateDisplay(cm, op.update);
        if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
            display.wheelStartX = display.wheelStartY = null;
        if (op.scrollTop != null)
            j.setScrollTop(cm, op.scrollTop, op.forceScroll);
        if (op.scrollLeft != null)
            j.setScrollLeft(cm, op.scrollLeft, true, true);
        if (op.scrollToPos) {
            let rect = j.scrollPosIntoView(cm, a.clipPos(doc, op.scrollToPos.from), a.clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
            j.maybeScrollWindow(cm, rect);
        }
        let hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
        if (hidden)
            for (let i = 0; i < hidden.length; ++i)
                if (!hidden[i].lines.length)
                    d.signal(hidden[i], 'hide');
        if (unhidden)
            for (let i = 0; i < unhidden.length; ++i)
                if (unhidden[i].lines.length)
                    d.signal(unhidden[i], 'unhide');
        if (display.wrapper.offsetHeight)
            doc.scrollTop = cm.display.scroller.scrollTop;
        if (op.changeObjs)
            d.signal(cm, 'changes', cm, op.changeObjs);
        if (op.update)
            op.update.finish();
    }
    function runInOp(cm, f) {
        if (cm.curOp)
            return f();
        startOperation(cm);
        try {
            return f();
        } finally {
            endOperation(cm);
        }
    }
    function operation(cm, f) {
        return function () {
            if (cm.curOp)
                return f.apply(cm, arguments);
            startOperation(cm);
            try {
                return f.apply(cm, arguments);
            } finally {
                endOperation(cm);
            }
        };
    }
    function methodOp(f) {
        return function () {
            if (this.curOp)
                return f.apply(this, arguments);
            startOperation(this);
            try {
                return f.apply(this, arguments);
            } finally {
                endOperation(this);
            }
        };
    }
    function docMethodOp(f) {
        return function () {
            let cm = this.cm;
            if (!cm || cm.curOp)
                return f.apply(this, arguments);
            startOperation(cm);
            try {
                return f.apply(this, arguments);
            } finally {
                endOperation(cm);
            }
        };
    }
    return {
        startOperation: startOperation,
        endOperation: endOperation,
        runInOp: runInOp,
        operation: operation,
        methodOp: methodOp,
        docMethodOp: docMethodOp
    };
});
define('skylark-codemirror/primitives/display/scroll_events',[
    '../util/browser',
    '../util/event',
    './update_display',
    './scrolling'
], function (a, b, c, d) {
    'use strict';
    let wheelSamples = 0, wheelPixelsPerUnit = null;
    if (a.ie)
        wheelPixelsPerUnit = -0.53;
    else if (a.gecko)
        wheelPixelsPerUnit = 15;
    else if (a.chrome)
        wheelPixelsPerUnit = -0.7;
    else if (a.safari)
        wheelPixelsPerUnit = -1 / 3;
    function wheelEventDelta(e) {
        let dx = e.wheelDeltaX, dy = e.wheelDeltaY;
        if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS)
            dx = e.detail;
        if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS)
            dy = e.detail;
        else if (dy == null)
            dy = e.wheelDelta;
        return {
            x: dx,
            y: dy
        };
    }
    function wheelEventPixels(e) {
        let delta = wheelEventDelta(e);
        delta.x *= wheelPixelsPerUnit;
        delta.y *= wheelPixelsPerUnit;
        return delta;
    }
    function onScrollWheel(cm, e) {
        let delta = wheelEventDelta(e), dx = delta.x, dy = delta.y;
        let display = cm.display, scroll = display.scroller;
        let canScrollX = scroll.scrollWidth > scroll.clientWidth;
        let canScrollY = scroll.scrollHeight > scroll.clientHeight;
        if (!(dx && canScrollX || dy && canScrollY))
            return;
        if (dy && a.mac && a.webkit) {
            outer:
                for (let cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
                    for (let i = 0; i < view.length; i++) {
                        if (view[i].node == cur) {
                            cm.display.currentWheelTarget = cur;
                            break outer;
                        }
                    }
                }
        }
        if (dx && !a.gecko && !a.presto && wheelPixelsPerUnit != null) {
            if (dy && canScrollY)
                d.updateScrollTop(cm, Math.max(0, scroll.scrollTop + dy * wheelPixelsPerUnit));
            d.setScrollLeft(cm, Math.max(0, scroll.scrollLeft + dx * wheelPixelsPerUnit));
            if (!dy || dy && canScrollY)
                b.e_preventDefault(e);
            display.wheelStartX = null;
            return;
        }
        if (dy && wheelPixelsPerUnit != null) {
            let pixels = dy * wheelPixelsPerUnit;
            let top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
            if (pixels < 0)
                top = Math.max(0, top + pixels - 50);
            else
                bot = Math.min(cm.doc.height, bot + pixels + 50);
            c.updateDisplaySimple(cm, {
                top: top,
                bottom: bot
            });
        }
        if (wheelSamples < 20) {
            if (display.wheelStartX == null) {
                display.wheelStartX = scroll.scrollLeft;
                display.wheelStartY = scroll.scrollTop;
                display.wheelDX = dx;
                display.wheelDY = dy;
                setTimeout(() => {
                    if (display.wheelStartX == null)
                        return;
                    let movedX = scroll.scrollLeft - display.wheelStartX;
                    let movedY = scroll.scrollTop - display.wheelStartY;
                    let sample = movedY && display.wheelDY && movedY / display.wheelDY || movedX && display.wheelDX && movedX / display.wheelDX;
                    display.wheelStartX = display.wheelStartY = null;
                    if (!sample)
                        return;
                    wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
                    ++wheelSamples;
                }, 200);
            } else {
                display.wheelDX += dx;
                display.wheelDY += dy;
            }
        }
    }
    return {
        wheelEventPixels: wheelEventPixels,
        onScrollWheel: onScrollWheel
    };
});
define('skylark-codemirror/primitives/display/highlight_worker',[
    '../line/highlight',
    '../modes',
    '../util/misc',
    './operations',
    './view_tracking'
], function (highlight, models, misc, operations, view_tracking) {
    'use strict';
    function startWorker(cm, time) {
        if (cm.doc.highlightFrontier < cm.display.viewTo)
            cm.state.highlight.set(time, misc.bind(highlightWorker, cm));
    }
    function highlightWorker(cm) {
        let doc = cm.doc;
        if (doc.highlightFrontier >= cm.display.viewTo)
            return;
        let end = +new Date() + cm.options.workTime;
        let context = highlight.getContextBefore(cm, doc.highlightFrontier);
        let changedLines = [];
        doc.iter(context.line, Math.min(doc.first + doc.size, cm.display.viewTo + 500), line => {
            if (context.line >= cm.display.viewFrom) {
                let oldStyles = line.styles;
                let resetState = line.text.length > cm.options.maxHighlightLength ? models.copyState(doc.mode, context.state) : null;
                let highlighted = highlight.highlightLine(cm, line, context, true);
                if (resetState)
                    context.state = resetState;
                line.styles = highlighted.styles;
                let oldCls = line.styleClasses, newCls = highlighted.classes;
                if (newCls)
                    line.styleClasses = newCls;
                else if (oldCls)
                    line.styleClasses = null;
                let ischange = !oldStyles || oldStyles.length != line.styles.length || oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
                for (let i = 0; !ischange && i < oldStyles.length; ++i)
                    ischange = oldStyles[i] != line.styles[i];
                if (ischange)
                    changedLines.push(context.line);
                line.stateAfter = context.save();
                context.nextLine();
            } else {
                if (line.text.length <= cm.options.maxHighlightLength)
                    highlight.processLine(cm, line.text, context);
                line.stateAfter = context.line % 5 == 0 ? context.save() : null;
                context.nextLine();
            }
            if (+new Date() > end) {
                startWorker(cm, cm.options.workDelay);
                return true;
            }
        });
        doc.highlightFrontier = context.line;
        doc.modeFrontier = Math.max(doc.modeFrontier, context.line);
        if (changedLines.length)
            operations.runInOp(cm, () => {
                for (let i = 0; i < changedLines.length; i++)
                    view_tracking.regLineChange(cm, changedLines[i], 'text');
            });
    }
    return { startWorker: startWorker };
});
define('skylark-codemirror/primitives/model/selection',[
    '../line/pos',
    '../util/misc'
], function (m_pos, m_misc) {
    'use strict';
    class Selection {
        constructor(ranges, primIndex) {
            this.ranges = ranges;
            this.primIndex = primIndex;
        }
        primary() {
            return this.ranges[this.primIndex];
        }
        equals(other) {
            if (other == this)
                return true;
            if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length)
                return false;
            for (let i = 0; i < this.ranges.length; i++) {
                let here = this.ranges[i], there = other.ranges[i];
                if (!m_pos.equalCursorPos(here.anchor, there.anchor) || !m_pos.equalCursorPos(here.head, there.head))
                    return false;
            }
            return true;
        }
        deepCopy() {
            let out = [];
            for (let i = 0; i < this.ranges.length; i++)
                out[i] = new Range(m_pos.copyPos(this.ranges[i].anchor), m_pos.copyPos(this.ranges[i].head));
            return new Selection(out, this.primIndex);
        }
        somethingSelected() {
            for (let i = 0; i < this.ranges.length; i++)
                if (!this.ranges[i].empty())
                    return true;
            return false;
        }
        contains(pos, end) {
            if (!end)
                end = pos;
            for (let i = 0; i < this.ranges.length; i++) {
                let range = this.ranges[i];
                if (m_pos.cmp(end, range.from()) >= 0 && m_pos.cmp(pos, range.to()) <= 0)
                    return i;
            }
            return -1;
        }
    }
    class Range {
        constructor(anchor, head) {
            this.anchor = anchor;
            this.head = head;
        }
        from() {
            return m_pos.minPos(this.anchor, this.head);
        }
        to() {
            return m_pos.maxPos(this.anchor, this.head);
        }
        empty() {
            return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
        }
    }
    function normalizeSelection(cm, ranges, primIndex) {
        let mayTouch = cm && cm.options.selectionsMayTouch;
        let prim = ranges[primIndex];
        ranges.sort((a, b) => m_pos.cmp(a.from(), b.from()));
        primIndex = m_misc.indexOf(ranges, prim);
        for (let i = 1; i < ranges.length; i++) {
            let cur = ranges[i], prev = ranges[i - 1];
            let diff = m_pos.cmp(prev.to(), cur.from());
            if (mayTouch && !cur.empty() ? diff > 0 : diff >= 0) {
                let from = m_pos.minPos(prev.from(), cur.from()), to = m_pos.maxPos(prev.to(), cur.to());
                let inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
                if (i <= primIndex)
                    --primIndex;
                ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
            }
        }
        return new Selection(ranges, primIndex);
    }
    function simpleSelection(anchor, head) {
        return new Selection([new Range(anchor, head || anchor)], 0);
    }
    return {
        Selection: Selection,
        Range: Range,
        normalizeSelection: normalizeSelection,
        simpleSelection: simpleSelection
    };
});
define('skylark-codemirror/primitives/model/change_measurement',[
    '../line/pos',
    '../util/misc',
    './selection'
], function (line_pos, misc, selection) {
    'use strict';
    function changeEnd(change) {
        if (!change.text)
            return change.to;
        return line_pos.Pos(change.from.line + change.text.length - 1, misc.lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0));
    }
    function adjustForChange(pos, change) {
        if (line_pos.cmp(pos, change.from) < 0)
            return pos;
        if (line_pos.cmp(pos, change.to) <= 0)
            return changeEnd(change);
        let line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
        if (pos.line == change.to.line)
            ch += changeEnd(change).ch - change.to.ch;
        return line_pos.Pos(line, ch);
    }
    function computeSelAfterChange(doc, change) {
        let out = [];
        for (let i = 0; i < doc.sel.ranges.length; i++) {
            let range = doc.sel.ranges[i];
            out.push(new selection.Range(adjustForChange(range.anchor, change), adjustForChange(range.head, change)));
        }
        return selection.normalizeSelection(doc.cm, out, doc.sel.primIndex);
    }
    function offsetPos(pos, old, nw) {
        if (pos.line == old.line)
            return line_pos.Pos(nw.line, pos.ch - old.ch + nw.ch);
        else
            return line_pos.Pos(nw.line + (pos.line - old.line), pos.ch);
    }
    function computeReplacedSel(doc, changes, hint) {
        let out = [];
        let oldPrev = line_pos.Pos(doc.first, 0), newPrev = oldPrev;
        for (let i = 0; i < changes.length; i++) {
            let change = changes[i];
            let from = offsetPos(change.from, oldPrev, newPrev);
            let to = offsetPos(changeEnd(change), oldPrev, newPrev);
            oldPrev = change.to;
            newPrev = to;
            if (hint == 'around') {
                let range = doc.sel.ranges[i], inv = line_pos.cmp(range.head, range.anchor) < 0;
                out[i] = new selection.Range(inv ? to : from, inv ? from : to);
            } else {
                out[i] = new selection.Range(from, from);
            }
        }
        return new selection.Selection(out, doc.sel.primIndex);
    }
    return {
        changeEnd: changeEnd,
        computeSelAfterChange: computeSelAfterChange,
        computeReplacedSel: computeReplacedSel
    };
});
define('skylark-codemirror/primitives/display/mode_state',[
    '../modes',
    //'./highlight_worker',// dependence cycle 
    './view_tracking'
], function (
    models, 
    //highlight_worker, 
    view_tracking
) {
    'use strict';
    function loadMode(cm) {
        cm.doc.mode = models.getMode(cm.options, cm.doc.modeOption);
        resetModeState(cm);
    }
    function resetModeState(cm) {
        cm.doc.iter(line => {
            if (line.stateAfter)
                line.stateAfter = null;
            if (line.styles)
                line.styles = null;
        });
        cm.doc.modeFrontier = cm.doc.highlightFrontier = cm.doc.first;
        cm.startWorker(cm, 100); // highlight_worker.startWorker(cm, 100);
        cm.state.modeGen++;
        if (cm.curOp)
            view_tracking.regChange(cm);
    }
    return {
        loadMode: loadMode,
        resetModeState: resetModeState
    };
});
define('skylark-codemirror/primitives/model/document_data',[
    '../display/mode_state',
    '../display/operations',
    '../display/view_tracking',
    '../line/line_data',
    '../line/spans',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../util/dom',
    '../util/misc',
    '../util/operation_group'
], function (a, b, c, d, e, f, g, h, i, j) {
    'use strict';
    function isWholeLineUpdate(doc, change) {
        return change.from.ch == 0 && change.to.ch == 0 && i.lst(change.text) == '' && (!doc.cm || doc.cm.options.wholeLineUpdateBefore);
    }
    function updateDoc(doc, change, markedSpans, estimateHeight) {
        function spansFor(n) {
            return markedSpans ? markedSpans[n] : null;
        }
        function update(line, text, spans) {
            d.updateLine(line, text, spans, estimateHeight);
            j.signalLater(line, 'change', line, change);
        }
        function linesFor(start, end) {
            let result = [];
            for (let i = start; i < end; ++i)
                result.push(new d.Line(text[i], spansFor(i), estimateHeight));
            return result;
        }
        let from = change.from, to = change.to, text = change.text;
        let firstLine = f.getLine(doc, from.line), lastLine = f.getLine(doc, to.line);
        let lastText = i.lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;
        if (change.full) {
            doc.insert(0, linesFor(0, text.length));
            doc.remove(text.length, doc.size - text.length);
        } else if (isWholeLineUpdate(doc, change)) {
            let added = linesFor(0, text.length - 1);
            update(lastLine, lastLine.text, lastSpans);
            if (nlines)
                doc.remove(from.line, nlines);
            if (added.length)
                doc.insert(from.line, added);
        } else if (firstLine == lastLine) {
            if (text.length == 1) {
                update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
            } else {
                let added = linesFor(1, text.length - 1);
                added.push(new d.Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight));
                update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
                doc.insert(from.line + 1, added);
            }
        } else if (text.length == 1) {
            update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
            doc.remove(from.line + 1, nlines);
        } else {
            update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
            update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
            let added = linesFor(1, text.length - 1);
            if (nlines > 1)
                doc.remove(from.line + 1, nlines - 1);
            doc.insert(from.line + 1, added);
        }
        j.signalLater(doc, 'change', doc, change);
    }
    function linkedDocs(doc, f, sharedHistOnly) {
        function propagate(doc, skip, sharedHist) {
            if (doc.linked)
                for (let i = 0; i < doc.linked.length; ++i) {
                    let rel = doc.linked[i];
                    if (rel.doc == skip)
                        continue;
                    let shared = sharedHist && rel.sharedHist;
                    if (sharedHistOnly && !shared)
                        continue;
                    f(rel.doc, shared);
                    propagate(rel.doc, doc, shared);
                }
        }
        propagate(doc, null, true);
    }
    function attachDoc(cm, doc) {
        if (doc.cm)
            throw new Error('This document is already in use.');
        cm.doc = doc;
        doc.cm = cm;
        g.estimateLineHeights(cm);
        a.loadMode(cm);
        setDirectionClass(cm);
        if (!cm.options.lineWrapping)
            e.findMaxLine(cm);
        cm.options.mode = doc.modeOption;
        c.regChange(cm);
    }
    function setDirectionClass(cm) {
        ;
        (cm.doc.direction == 'rtl' ? h.addClass : h.rmClass)(cm.display.lineDiv, 'CodeMirror-rtl');
    }
    function directionChanged(cm) {
        b.runInOp(cm, () => {
            setDirectionClass(cm);
            c.regChange(cm);
        });
    }
    return {
        isWholeLineUpdate: isWholeLineUpdate,
        updateDoc: updateDoc,
        linkedDocs: linkedDocs,
        attachDoc: attachDoc,
        directionChanged: directionChanged
    };
});
define('skylark-codemirror/primitives/model/history',[
    '../line/pos',
    '../line/spans',
    '../line/utils_line',
    '../util/event',
    '../util/misc',
    './change_measurement',
    './document_data',
    './selection'
], function (a, b, c, d, e, f, g, h) {
    'use strict';
    function History(startGen) {
        this.done = [];
        this.undone = [];
        this.undoDepth = Infinity;
        this.lastModTime = this.lastSelTime = 0;
        this.lastOp = this.lastSelOp = null;
        this.lastOrigin = this.lastSelOrigin = null;
        this.generation = this.maxGeneration = startGen || 1;
    }
    function historyChangeFromChange(doc, change) {
        let histChange = {
            from: a.copyPos(change.from),
            to: f.changeEnd(change),
            text: c.getBetween(doc, change.from, change.to)
        };
        attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
        g.linkedDocs(doc, doc => attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1), true);
        return histChange;
    }
    function clearSelectionEvents(array) {
        while (array.length) {
            let last = e.lst(array);
            if (last.ranges)
                array.pop();
            else
                break;
        }
    }
    function lastChangeEvent(hist, force) {
        if (force) {
            clearSelectionEvents(hist.done);
            return e.lst(hist.done);
        } else if (hist.done.length && !e.lst(hist.done).ranges) {
            return e.lst(hist.done);
        } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
            hist.done.pop();
            return e.lst(hist.done);
        }
    }
    function addChangeToHistory(doc, change, selAfter, opId) {
        let hist = doc.history;
        hist.undone.length = 0;
        let time = +new Date(), cur;
        let last;
        if ((hist.lastOp == opId || hist.lastOrigin == change.origin && change.origin && (change.origin.charAt(0) == '+' && hist.lastModTime > time - (doc.cm ? doc.cm.options.historyEventDelay : 500) || change.origin.charAt(0) == '*')) && (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
            last = e.lst(cur.changes);
            if (a.cmp(change.from, change.to) == 0 && a.cmp(change.from, last.to) == 0) {
                last.to = f.changeEnd(change);
            } else {
                cur.changes.push(historyChangeFromChange(doc, change));
            }
        } else {
            let before = e.lst(hist.done);
            if (!before || !before.ranges)
                pushSelectionToHistory(doc.sel, hist.done);
            cur = {
                changes: [historyChangeFromChange(doc, change)],
                generation: hist.generation
            };
            hist.done.push(cur);
            while (hist.done.length > hist.undoDepth) {
                hist.done.shift();
                if (!hist.done[0].ranges)
                    hist.done.shift();
            }
        }
        hist.done.push(selAfter);
        hist.generation = ++hist.maxGeneration;
        hist.lastModTime = hist.lastSelTime = time;
        hist.lastOp = hist.lastSelOp = opId;
        hist.lastOrigin = hist.lastSelOrigin = change.origin;
        if (!last)
            d.signal(doc, 'historyAdded');
    }
    function selectionEventCanBeMerged(doc, origin, prev, sel) {
        let ch = origin.charAt(0);
        return ch == '*' || ch == '+' && prev.ranges.length == sel.ranges.length && prev.somethingSelected() == sel.somethingSelected() && new Date() - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500);
    }
    function addSelectionToHistory(doc, sel, opId, options) {
        let hist = doc.history, origin = options && options.origin;
        if (opId == hist.lastSelOp || origin && hist.lastSelOrigin == origin && (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin || selectionEventCanBeMerged(doc, origin, e.lst(hist.done), sel)))
            hist.done[hist.done.length - 1] = sel;
        else
            pushSelectionToHistory(sel, hist.done);
        hist.lastSelTime = +new Date();
        hist.lastSelOrigin = origin;
        hist.lastSelOp = opId;
        if (options && options.clearRedo !== false)
            clearSelectionEvents(hist.undone);
    }
    function pushSelectionToHistory(sel, dest) {
        let top = e.lst(dest);
        if (!(top && top.ranges && top.equals(sel)))
            dest.push(sel);
    }
    function attachLocalSpans(doc, change, from, to) {
        let existing = change['spans_' + doc.id], n = 0;
        doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), line => {
            if (line.markedSpans)
                (existing || (existing = change['spans_' + doc.id] = {}))[n] = line.markedSpans;
            ++n;
        });
    }
    function removeClearedSpans(spans) {
        if (!spans)
            return null;
        let out;
        for (let i = 0; i < spans.length; ++i) {
            if (spans[i].marker.explicitlyCleared) {
                if (!out)
                    out = spans.slice(0, i);
            } else if (out)
                out.push(spans[i]);
        }
        return !out ? spans : out.length ? out : null;
    }
    function getOldSpans(doc, change) {
        let found = change['spans_' + doc.id];
        if (!found)
            return null;
        let nw = [];
        for (let i = 0; i < change.text.length; ++i)
            nw.push(removeClearedSpans(found[i]));
        return nw;
    }
    function mergeOldSpans(doc, change) {
        let old = getOldSpans(doc, change);
        let stretched = b.stretchSpansOverChange(doc, change);
        if (!old)
            return stretched;
        if (!stretched)
            return old;
        for (let i = 0; i < old.length; ++i) {
            let oldCur = old[i], stretchCur = stretched[i];
            if (oldCur && stretchCur) {
                spans:
                    for (let j = 0; j < stretchCur.length; ++j) {
                        let span = stretchCur[j];
                        for (let k = 0; k < oldCur.length; ++k)
                            if (oldCur[k].marker == span.marker)
                                continue spans;
                        oldCur.push(span);
                    }
            } else if (stretchCur) {
                old[i] = stretchCur;
            }
        }
        return old;
    }
    function copyHistoryArray(events, newGroup, instantiateSel) {
        let copy = [];
        for (let i = 0; i < events.length; ++i) {
            let event = events[i];
            if (event.ranges) {
                copy.push(instantiateSel ? h.Selection.prototype.deepCopy.call(event) : event);
                continue;
            }
            let changes = event.changes, newChanges = [];
            copy.push({ changes: newChanges });
            for (let j = 0; j < changes.length; ++j) {
                let change = changes[j], m;
                newChanges.push({
                    from: change.from,
                    to: change.to,
                    text: change.text
                });
                if (newGroup)
                    for (var prop in change)
                        if (m = prop.match(/^spans_(\d+)$/)) {
                            if (e.indexOf(newGroup, Number(m[1])) > -1) {
                                e.lst(newChanges)[prop] = change[prop];
                                delete change[prop];
                            }
                        }
            }
        }
        return copy;
    }
    return {
        History: History,
        historyChangeFromChange: historyChangeFromChange,
        addChangeToHistory: addChangeToHistory,
        addSelectionToHistory: addSelectionToHistory,
        pushSelectionToHistory: pushSelectionToHistory,
        mergeOldSpans: mergeOldSpans,
        copyHistoryArray: copyHistoryArray
    };
});
define('skylark-codemirror/primitives/model/selection_updates',[
    '../util/operation_group',
    '../display/scrolling',
    '../line/pos',
    '../line/utils_line',
    '../util/event',
    '../util/misc',
    './history',
    './selection'
], function (a, b, c, d, e, f, g, h) {
    'use strict';
    function extendRange(range, head, other, extend) {
        if (extend) {
            let anchor = range.anchor;
            if (other) {
                let posBefore = c.cmp(head, anchor) < 0;
                if (posBefore != c.cmp(other, anchor) < 0) {
                    anchor = head;
                    head = other;
                } else if (posBefore != c.cmp(head, other) < 0) {
                    head = other;
                }
            }
            return new h.Range(anchor, head);
        } else {
            return new h.Range(other || head, head);
        }
    }
    function extendSelection(doc, head, other, options, extend) {
        if (extend == null)
            extend = doc.cm && (doc.cm.display.shift || doc.extend);
        setSelection(doc, new h.Selection([extendRange(doc.sel.primary(), head, other, extend)], 0), options);
    }
    function extendSelections(doc, heads, options) {
        let out = [];
        let extend = doc.cm && (doc.cm.display.shift || doc.extend);
        for (let i = 0; i < doc.sel.ranges.length; i++)
            out[i] = extendRange(doc.sel.ranges[i], heads[i], null, extend);
        let newSel = h.normalizeSelection(doc.cm, out, doc.sel.primIndex);
        setSelection(doc, newSel, options);
    }
    function replaceOneSelection(doc, i, range, options) {
        let ranges = doc.sel.ranges.slice(0);
        ranges[i] = range;
        setSelection(doc, h.normalizeSelection(doc.cm, ranges, doc.sel.primIndex), options);
    }
    function setSimpleSelection(doc, anchor, head, options) {
        setSelection(doc, h.simpleSelection(anchor, head), options);
    }
    function filterSelectionChange(doc, sel, options) {
        let obj = {
            ranges: sel.ranges,
            update: function (ranges) {
                this.ranges = [];
                for (let i = 0; i < ranges.length; i++)
                    this.ranges[i] = new h.Range(c.clipPos(doc, ranges[i].anchor), c.clipPos(doc, ranges[i].head));
            },
            origin: options && options.origin
        };
        e.signal(doc, 'beforeSelectionChange', doc, obj);
        if (doc.cm)
            e.signal(doc.cm, 'beforeSelectionChange', doc.cm, obj);
        if (obj.ranges != sel.ranges)
            return h.normalizeSelection(doc.cm, obj.ranges, obj.ranges.length - 1);
        else
            return sel;
    }
    function setSelectionReplaceHistory(doc, sel, options) {
        let done = doc.history.done, last = f.lst(done);
        if (last && last.ranges) {
            done[done.length - 1] = sel;
            setSelectionNoUndo(doc, sel, options);
        } else {
            setSelection(doc, sel, options);
        }
    }
    function setSelection(doc, sel, options) {
        setSelectionNoUndo(doc, sel, options);
        g.addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
    }
    function setSelectionNoUndo(doc, sel, options) {
        if (e.hasHandler(doc, 'beforeSelectionChange') || doc.cm && e.hasHandler(doc.cm, 'beforeSelectionChange'))
            sel = filterSelectionChange(doc, sel, options);
        let bias = options && options.bias || (c.cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
        setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));
        if (!(options && options.scroll === false) && doc.cm)
            b.ensureCursorVisible(doc.cm);
    }
    function setSelectionInner(doc, sel) {
        if (sel.equals(doc.sel))
            return;
        doc.sel = sel;
        if (doc.cm) {
            doc.cm.curOp.updateInput = 1;
            doc.cm.curOp.selectionChanged = true;
            e.signalCursorActivity(doc.cm);
        }
        a.signalLater(doc, 'cursorActivity', doc);
    }
    function reCheckSelection(doc) {
        setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false));
    }
    function skipAtomicInSelection(doc, sel, bias, mayClear) {
        let out;
        for (let i = 0; i < sel.ranges.length; i++) {
            let range = sel.ranges[i];
            let old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i];
            let newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear);
            let newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear);
            if (out || newAnchor != range.anchor || newHead != range.head) {
                if (!out)
                    out = sel.ranges.slice(0, i);
                out[i] = new h.Range(newAnchor, newHead);
            }
        }
        return out ? h.normalizeSelection(doc.cm, out, sel.primIndex) : sel;
    }
    function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
        let line = d.getLine(doc, pos.line);
        if (line.markedSpans)
            for (let i = 0; i < line.markedSpans.length; ++i) {
                let sp = line.markedSpans[i], m = sp.marker;
                if ((sp.from == null || (m.inclusiveLeft ? sp.from <= pos.ch : sp.from < pos.ch)) && (sp.to == null || (m.inclusiveRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
                    if (mayClear) {
                        e.signal(m, 'beforeCursorEnter');
                        if (m.explicitlyCleared) {
                            if (!line.markedSpans)
                                break;
                            else {
                                --i;
                                continue;
                            }
                        }
                    }
                    if (!m.atomic)
                        continue;
                    if (oldPos) {
                        let near = m.find(dir < 0 ? 1 : -1), diff;
                        if (dir < 0 ? m.inclusiveRight : m.inclusiveLeft)
                            near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null);
                        if (near && near.line == pos.line && (diff = c.cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
                            return skipAtomicInner(doc, near, pos, dir, mayClear);
                    }
                    let far = m.find(dir < 0 ? -1 : 1);
                    if (dir < 0 ? m.inclusiveLeft : m.inclusiveRight)
                        far = movePos(doc, far, dir, far.line == pos.line ? line : null);
                    return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null;
                }
            }
        return pos;
    }
    function skipAtomic(doc, pos, oldPos, bias, mayClear) {
        let dir = bias || 1;
        let found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) || !mayClear && skipAtomicInner(doc, pos, oldPos, dir, true) || skipAtomicInner(doc, pos, oldPos, -dir, mayClear) || !mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true);
        if (!found) {
            doc.cantEdit = true;
            return c.Pos(doc.first, 0);
        }
        return found;
    }
    function movePos(doc, pos, dir, line) {
        if (dir < 0 && pos.ch == 0) {
            if (pos.line > doc.first)
                return c.clipPos(doc, c.Pos(pos.line - 1));
            else
                return null;
        } else if (dir > 0 && pos.ch == (line || d.getLine(doc, pos.line)).text.length) {
            if (pos.line < doc.first + doc.size - 1)
                return c.Pos(pos.line + 1, 0);
            else
                return null;
        } else {
            return new c.Pos(pos.line, pos.ch + dir);
        }
    }
    function selectAll(cm) {
        cm.setSelection(c.Pos(cm.firstLine(), 0), c.Pos(cm.lastLine()), f.sel_dontScroll);
    }
    return {
        extendRange: extendRange,
        extendSelection: extendSelection,
        extendSelections: extendSelections,
        replaceOneSelection: replaceOneSelection,
        setSimpleSelection: setSimpleSelection,
        setSelectionReplaceHistory: setSelectionReplaceHistory,
        setSelection: setSelection,
        setSelectionNoUndo: setSelectionNoUndo,
        reCheckSelection: reCheckSelection,
        skipAtomic: skipAtomic,
        selectAll: selectAll
    };
});
define('skylark-codemirror/primitives/model/changes',[
    '../line/highlight',
    '../display/highlight_worker',
    '../display/operations',
    '../display/view_tracking',
    '../line/pos',
    '../line/saw_special_spans',
    '../line/spans',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../util/event',
    '../util/misc',
    '../util/operation_group',
    './change_measurement',
    './document_data',
    './history',
    './selection',
    './selection_updates'
], function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    'use strict';
    function filterChange(doc, change, update) {
        let obj = {
            canceled: false,
            from: change.from,
            to: change.to,
            text: change.text,
            origin: change.origin,
            cancel: () => obj.canceled = true
        };
        if (update)
            obj.update = (from, to, text, origin) => {
                if (from)
                    obj.from = e.clipPos(doc, from);
                if (to)
                    obj.to = e.clipPos(doc, to);
                if (text)
                    obj.text = text;
                if (origin !== undefined)
                    obj.origin = origin;
            };
        j.signal(doc, 'beforeChange', doc, obj);
        if (doc.cm)
            j.signal(doc.cm, 'beforeChange', doc.cm, obj);
        if (obj.canceled) {
            if (doc.cm)
                doc.cm.curOp.updateInput = 2;
            return null;
        }
        return {
            from: obj.from,
            to: obj.to,
            text: obj.text,
            origin: obj.origin
        };
    }
    function makeChange(doc, change, ignoreReadOnly) {
        if (doc.cm) {
            if (!doc.cm.curOp)
                return c.operation(doc.cm, makeChange)(doc, change, ignoreReadOnly);
            if (doc.cm.state.suppressEdits)
                return;
        }
        if (j.hasHandler(doc, 'beforeChange') || doc.cm && j.hasHandler(doc.cm, 'beforeChange')) {
            change = filterChange(doc, change, true);
            if (!change)
                return;
        }
        let split = f.sawReadOnlySpans && !ignoreReadOnly && g.removeReadOnlyRanges(doc, change.from, change.to);
        if (split) {
            for (let i = split.length - 1; i >= 0; --i)
                makeChangeInner(doc, {
                    from: split[i].from,
                    to: split[i].to,
                    text: i ? [''] : change.text,
                    origin: change.origin
                });
        } else {
            makeChangeInner(doc, change);
        }
    }
    function makeChangeInner(doc, change) {
        if (change.text.length == 1 && change.text[0] == '' && e.cmp(change.from, change.to) == 0)
            return;
        let selAfter = m.computeSelAfterChange(doc, change);
        o.addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);
        makeChangeSingleDoc(doc, change, selAfter, g.stretchSpansOverChange(doc, change));
        let rebased = [];
        n.linkedDocs(doc, (doc, sharedHist) => {
            if (!sharedHist && k.indexOf(rebased, doc.history) == -1) {
                rebaseHist(doc.history, change);
                rebased.push(doc.history);
            }
            makeChangeSingleDoc(doc, change, null, g.stretchSpansOverChange(doc, change));
        });
    }
    function makeChangeFromHistory(doc, type, allowSelectionOnly) {
        let suppress = doc.cm && doc.cm.state.suppressEdits;
        if (suppress && !allowSelectionOnly)
            return;
        let hist = doc.history, event, selAfter = doc.sel;
        let source = type == 'undo' ? hist.done : hist.undone, dest = type == 'undo' ? hist.undone : hist.done;
        let i = 0;
        for (; i < source.length; i++) {
            event = source[i];
            if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
                break;
        }
        if (i == source.length)
            return;
        hist.lastOrigin = hist.lastSelOrigin = null;
        for (;;) {
            event = source.pop();
            if (event.ranges) {
                o.pushSelectionToHistory(event, dest);
                if (allowSelectionOnly && !event.equals(doc.sel)) {
                    q.setSelection(doc, event, { clearRedo: false });
                    return;
                }
                selAfter = event;
            } else if (suppress) {
                source.push(event);
                return;
            } else
                break;
        }
        let antiChanges = [];
        o.pushSelectionToHistory(selAfter, dest);
        dest.push({
            changes: antiChanges,
            generation: hist.generation
        });
        hist.generation = event.generation || ++hist.maxGeneration;
        let filter = j.hasHandler(doc, 'beforeChange') || doc.cm && j.hasHandler(doc.cm, 'beforeChange');
        for (let i = event.changes.length - 1; i >= 0; --i) {
            let change = event.changes[i];
            change.origin = type;
            if (filter && !filterChange(doc, change, false)) {
                source.length = 0;
                return;
            }
            antiChanges.push(o.historyChangeFromChange(doc, change));
            let after = i ? m.computeSelAfterChange(doc, change) : k.lst(source);
            makeChangeSingleDoc(doc, change, after, o.mergeOldSpans(doc, change));
            if (!i && doc.cm)
                doc.cm.scrollIntoView({
                    from: change.from,
                    to: m.changeEnd(change)
                });
            let rebased = [];
            n.linkedDocs(doc, (doc, sharedHist) => {
                if (!sharedHist && k.indexOf(rebased, doc.history) == -1) {
                    rebaseHist(doc.history, change);
                    rebased.push(doc.history);
                }
                makeChangeSingleDoc(doc, change, null, o.mergeOldSpans(doc, change));
            });
        }
    }
    function shiftDoc(doc, distance) {
        if (distance == 0)
            return;
        doc.first += distance;
        doc.sel = new p.Selection(k.map(doc.sel.ranges, range => new p.Range(e.Pos(range.anchor.line + distance, range.anchor.ch), e.Pos(range.head.line + distance, range.head.ch))), doc.sel.primIndex);
        if (doc.cm) {
            d.regChange(doc.cm, doc.first, doc.first - distance, distance);
            for (let d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
                d.regLineChange(doc.cm, l, 'gutter');
        }
    }
    function makeChangeSingleDoc(doc, change, selAfter, spans) {
        if (doc.cm && !doc.cm.curOp)
            return c.operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);
        if (change.to.line < doc.first) {
            shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
            return;
        }
        if (change.from.line > doc.lastLine())
            return;
        if (change.from.line < doc.first) {
            let shift = change.text.length - 1 - (doc.first - change.from.line);
            shiftDoc(doc, shift);
            change = {
                from: e.Pos(doc.first, 0),
                to: e.Pos(change.to.line + shift, change.to.ch),
                text: [k.lst(change.text)],
                origin: change.origin
            };
        }
        let last = doc.lastLine();
        if (change.to.line > last) {
            change = {
                from: change.from,
                to: e.Pos(last, h.getLine(doc, last).text.length),
                text: [change.text[0]],
                origin: change.origin
            };
        }
        change.removed = h.getBetween(doc, change.from, change.to);
        if (!selAfter)
            selAfter = m.computeSelAfterChange(doc, change);
        if (doc.cm)
            makeChangeSingleDocInEditor(doc.cm, change, spans);
        else
            n.updateDoc(doc, change, spans);
        q.setSelectionNoUndo(doc, selAfter, k.sel_dontScroll);
    }
    function makeChangeSingleDocInEditor(cm, change, spans) {
        let doc = cm.doc, display = cm.display, from = change.from, to = change.to;
        let recomputeMaxLength = false, checkWidthStart = from.line;
        if (!cm.options.lineWrapping) {
            checkWidthStart = h.lineNo(g.visualLine(h.getLine(doc, from.line)));
            doc.iter(checkWidthStart, to.line + 1, line => {
                if (line == display.maxLine) {
                    recomputeMaxLength = true;
                    return true;
                }
            });
        }
        if (doc.sel.contains(change.from, change.to) > -1)
            j.signalCursorActivity(cm);
        n.updateDoc(doc, change, spans, i.estimateHeight(cm));
        if (!cm.options.lineWrapping) {
            doc.iter(checkWidthStart, from.line + change.text.length, line => {
                let len = g.lineLength(line);
                if (len > display.maxLineLength) {
                    display.maxLine = line;
                    display.maxLineLength = len;
                    display.maxLineChanged = true;
                    recomputeMaxLength = false;
                }
            });
            if (recomputeMaxLength)
                cm.curOp.updateMaxLine = true;
        }
        a.retreatFrontier(doc, from.line);
        b.startWorker(cm, 400);
        let lendiff = change.text.length - (to.line - from.line) - 1;
        if (change.full)
            d.regChange(cm);
        else if (from.line == to.line && change.text.length == 1 && !n.isWholeLineUpdate(cm.doc, change))
            d.regLineChange(cm, from.line, 'text');
        else
            d.regChange(cm, from.line, to.line + 1, lendiff);
        let changesHandler = j.hasHandler(cm, 'changes'), changeHandler = j.hasHandler(cm, 'change');
        if (changeHandler || changesHandler) {
            let obj = {
                from: from,
                to: to,
                text: change.text,
                removed: change.removed,
                origin: change.origin
            };
            if (changeHandler)
                l.signalLater(cm, 'change', cm, obj);
            if (changesHandler)
                (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);
        }
        cm.display.selForContextMenu = null;
    }
    function replaceRange(doc, code, from, to, origin) {
        if (!to)
            to = from;
        if (e.cmp(to, from) < 0)
            [from, to] = [
                to,
                from
            ];
        if (typeof code == 'string')
            code = doc.splitLines(code);
        makeChange(doc, {
            from,
            to,
            text: code,
            origin
        });
    }
    function rebaseHistSelSingle(pos, from, to, diff) {
        if (to < pos.line) {
            pos.line += diff;
        } else if (from < pos.line) {
            pos.line = from;
            pos.ch = 0;
        }
    }
    function rebaseHistArray(array, from, to, diff) {
        for (let i = 0; i < array.length; ++i) {
            let sub = array[i], ok = true;
            if (sub.ranges) {
                if (!sub.copied) {
                    sub = array[i] = sub.deepCopy();
                    sub.copied = true;
                }
                for (let j = 0; j < sub.ranges.length; j++) {
                    rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
                    rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
                }
                continue;
            }
            for (let j = 0; j < sub.changes.length; ++j) {
                let cur = sub.changes[j];
                if (to < cur.from.line) {
                    cur.from = e.Pos(cur.from.line + diff, cur.from.ch);
                    cur.to = e.Pos(cur.to.line + diff, cur.to.ch);
                } else if (from <= cur.to.line) {
                    ok = false;
                    break;
                }
            }
            if (!ok) {
                array.splice(0, i + 1);
                i = 0;
            }
        }
    }
    function rebaseHist(hist, change) {
        let from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
        rebaseHistArray(hist.done, from, to, diff);
        rebaseHistArray(hist.undone, from, to, diff);
    }
    function changeLine(doc, handle, changeType, op) {
        let no = handle, line = handle;
        if (typeof handle == 'number')
            line = h.getLine(doc, e.clipLine(doc, handle));
        else
            no = h.lineNo(handle);
        if (no == null)
            return null;
        if (op(line, no) && doc.cm)
            d.regLineChange(doc.cm, no, changeType);
        return line;
    }
    return {
        makeChange: makeChange,
        makeChangeFromHistory: makeChangeFromHistory,
        replaceRange: replaceRange,
        changeLine: changeLine
    };
});
define('skylark-codemirror/primitives/model/chunk',[
    '../line/line_data',
    '../util/misc',
    '../util/operation_group'
], function (a, b, c) {
    'use strict';
    function LeafChunk(lines) {
        this.lines = lines;
        this.parent = null;
        let height = 0;
        for (let i = 0; i < lines.length; ++i) {
            lines[i].parent = this;
            height += lines[i].height;
        }
        this.height = height;
    }
    LeafChunk.prototype = {
        chunkSize() {
            return this.lines.length;
        },
        removeInner(at, n) {
            for (let i = at, e = at + n; i < e; ++i) {
                let line = this.lines[i];
                this.height -= line.height;
                a.cleanUpLine(line);
                c.signalLater(line, 'delete');
            }
            this.lines.splice(at, n);
        },
        collapse(lines) {
            lines.push.apply(lines, this.lines);
        },
        insertInner(at, lines, height) {
            this.height += height;
            this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
            for (let i = 0; i < lines.length; ++i)
                lines[i].parent = this;
        },
        iterN(at, n, op) {
            for (let e = at + n; at < e; ++at)
                if (op(this.lines[at]))
                    return true;
        }
    };
    function BranchChunk(children) {
        this.children = children;
        let size = 0, height = 0;
        for (let i = 0; i < children.length; ++i) {
            let ch = children[i];
            size += ch.chunkSize();
            height += ch.height;
            ch.parent = this;
        }
        this.size = size;
        this.height = height;
        this.parent = null;
    }
    BranchChunk.prototype = {
        chunkSize() {
            return this.size;
        },
        removeInner(at, n) {
            this.size -= n;
            for (let i = 0; i < this.children.length; ++i) {
                let child = this.children[i], sz = child.chunkSize();
                if (at < sz) {
                    let rm = Math.min(n, sz - at), oldHeight = child.height;
                    child.removeInner(at, rm);
                    this.height -= oldHeight - child.height;
                    if (sz == rm) {
                        this.children.splice(i--, 1);
                        child.parent = null;
                    }
                    if ((n -= rm) == 0)
                        break;
                    at = 0;
                } else
                    at -= sz;
            }
            if (this.size - n < 25 && (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
                let lines = [];
                this.collapse(lines);
                this.children = [new LeafChunk(lines)];
                this.children[0].parent = this;
            }
        },
        collapse(lines) {
            for (let i = 0; i < this.children.length; ++i)
                this.children[i].collapse(lines);
        },
        insertInner(at, lines, height) {
            this.size += lines.length;
            this.height += height;
            for (let i = 0; i < this.children.length; ++i) {
                let child = this.children[i], sz = child.chunkSize();
                if (at <= sz) {
                    child.insertInner(at, lines, height);
                    if (child.lines && child.lines.length > 50) {
                        let remaining = child.lines.length % 25 + 25;
                        for (let pos = remaining; pos < child.lines.length;) {
                            let leaf = new LeafChunk(child.lines.slice(pos, pos += 25));
                            child.height -= leaf.height;
                            this.children.splice(++i, 0, leaf);
                            leaf.parent = this;
                        }
                        child.lines = child.lines.slice(0, remaining);
                        this.maybeSpill();
                    }
                    break;
                }
                at -= sz;
            }
        },
        maybeSpill() {
            if (this.children.length <= 10)
                return;
            let me = this;
            do {
                let spilled = me.children.splice(me.children.length - 5, 5);
                let sibling = new BranchChunk(spilled);
                if (!me.parent) {
                    let copy = new BranchChunk(me.children);
                    copy.parent = me;
                    me.children = [
                        copy,
                        sibling
                    ];
                    me = copy;
                } else {
                    me.size -= sibling.size;
                    me.height -= sibling.height;
                    let myIndex = b.indexOf(me.parent.children, me);
                    me.parent.children.splice(myIndex + 1, 0, sibling);
                }
                sibling.parent = me.parent;
            } while (me.children.length > 10);
            me.parent.maybeSpill();
        },
        iterN(at, n, op) {
            for (let i = 0; i < this.children.length; ++i) {
                let child = this.children[i], sz = child.chunkSize();
                if (at < sz) {
                    let used = Math.min(n, sz - at);
                    if (child.iterN(at, used, op))
                        return true;
                    if ((n -= used) == 0)
                        break;
                    at = 0;
                } else
                    at -= sz;
            }
        }
    };
    return {
        LeafChunk: LeafChunk,
        BranchChunk: BranchChunk
    };
});
define('skylark-codemirror/primitives/model/line_widget',[
    '../display/operations',
    '../display/scrolling',
    '../display/view_tracking',
    '../line/spans',
    '../line/utils_line',
    '../measurement/widgets',
    './changes',
    '../util/event',
    '../util/operation_group'
], function (a, b, c, d, e, f, g, h, i) {
    'use strict';
    class LineWidget {
        constructor(doc, node, options) {
            if (options)
                for (let opt in options)
                    if (options.hasOwnProperty(opt))
                        this[opt] = options[opt];
            this.doc = doc;
            this.node = node;
        }
        clear() {
            let cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = e.lineNo(line);
            if (no == null || !ws)
                return;
            for (let i = 0; i < ws.length; ++i)
                if (ws[i] == this)
                    ws.splice(i--, 1);
            if (!ws.length)
                line.widgets = null;
            let height = f.widgetHeight(this);
            e.updateLineHeight(line, Math.max(0, line.height - height));
            if (cm) {
                a.runInOp(cm, () => {
                    adjustScrollWhenAboveVisible(cm, line, -height);
                    c.regLineChange(cm, no, 'widget');
                });
                i.signalLater(cm, 'lineWidgetCleared', cm, this, no);
            }
        }
        changed() {
            let oldH = this.height, cm = this.doc.cm, line = this.line;
            this.height = null;
            let diff = f.widgetHeight(this) - oldH;
            if (!diff)
                return;
            if (!d.lineIsHidden(this.doc, line))
                e.updateLineHeight(line, line.height + diff);
            if (cm) {
                a.runInOp(cm, () => {
                    cm.curOp.forceUpdate = true;
                    adjustScrollWhenAboveVisible(cm, line, diff);
                    i.signalLater(cm, 'lineWidgetChanged', cm, this, e.lineNo(line));
                });
            }
        }
    }
    h.eventMixin(LineWidget);
    function adjustScrollWhenAboveVisible(cm, line, diff) {
        if (d.heightAtLine(line) < (cm.curOp && cm.curOp.scrollTop || cm.doc.scrollTop))
            b.addToScrollTop(cm, diff);
    }
    function addLineWidget(doc, handle, node, options) {
        let widget = new LineWidget(doc, node, options);
        let cm = doc.cm;
        if (cm && widget.noHScroll)
            cm.display.alignWidgets = true;
        g.changeLine(doc, handle, 'widget', line => {
            let widgets = line.widgets || (line.widgets = []);
            if (widget.insertAt == null)
                widgets.push(widget);
            else
                widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget);
            widget.line = line;
            if (cm && !d.lineIsHidden(doc, line)) {
                let aboveVisible = d.heightAtLine(line) < doc.scrollTop;
                e.updateLineHeight(line, line.height + f.widgetHeight(widget));
                if (aboveVisible)
                    b.addToScrollTop(cm, widget.height);
                cm.curOp.forceUpdate = true;
            }
            return true;
        });
        if (cm)
            i.signalLater(cm, 'lineWidgetAdded', cm, widget, typeof handle == 'number' ? handle : e.lineNo(handle));
        return widget;
    }
    return {
        LineWidget: LineWidget,
        addLineWidget: addLineWidget
    };
});
define('skylark-codemirror/primitives/model/mark_text',[
    '../util/dom',
    '../util/event',
    '../display/operations',
    '../line/pos',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../line/saw_special_spans',
    '../line/spans',
    '../util/misc',
    '../util/operation_group',
    '../measurement/widgets',
    '../display/view_tracking',
    './document_data',
    './history',
    './selection_updates'
], function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    'use strict';
    let nextMarkerId = 0;
    class TextMarker {
        constructor(doc, type) {
            this.lines = [];
            this.type = type;
            this.doc = doc;
            this.id = ++nextMarkerId;
        }
        clear() {
            if (this.explicitlyCleared)
                return;
            let cm = this.doc.cm, withOp = cm && !cm.curOp;
            if (withOp)
                c.startOperation(cm);
            if (b.hasHandler(this, 'clear')) {
                let found = this.find();
                if (found)
                    j.signalLater(this, 'clear', found.from, found.to);
            }
            let min = null, max = null;
            for (let i = 0; i < this.lines.length; ++i) {
                let line = this.lines[i];
                let span = h.getMarkedSpanFor(line.markedSpans, this);
                if (cm && !this.collapsed)
                    l.regLineChange(cm, e.lineNo(line), 'text');
                else if (cm) {
                    if (span.to != null)
                        max = e.lineNo(line);
                    if (span.from != null)
                        min = e.lineNo(line);
                }
                line.markedSpans = h.removeMarkedSpan(line.markedSpans, span);
                if (span.from == null && this.collapsed && !h.lineIsHidden(this.doc, line) && cm)
                    e.updateLineHeight(line, f.textHeight(cm.display));
            }
            if (cm && this.collapsed && !cm.options.lineWrapping)
                for (let i = 0; i < this.lines.length; ++i) {
                    let visual = h.visualLine(this.lines[i]), len = h.lineLength(visual);
                    if (len > cm.display.maxLineLength) {
                        cm.display.maxLine = visual;
                        cm.display.maxLineLength = len;
                        cm.display.maxLineChanged = true;
                    }
                }
            if (min != null && cm && this.collapsed)
                l.regChange(cm, min, max + 1);
            this.lines.length = 0;
            this.explicitlyCleared = true;
            if (this.atomic && this.doc.cantEdit) {
                this.doc.cantEdit = false;
                if (cm)
                    o.reCheckSelection(cm.doc);
            }
            if (cm)
                j.signalLater(cm, 'markerCleared', cm, this, min, max);
            if (withOp)
                c.endOperation(cm);
            if (this.parent)
                this.parent.clear();
        }
        find(side, lineObj) {
            if (side == null && this.type == 'bookmark')
                side = 1;
            let from, to;
            for (let i = 0; i < this.lines.length; ++i) {
                let line = this.lines[i];
                let span = h.getMarkedSpanFor(line.markedSpans, this);
                if (span.from != null) {
                    from = d.Pos(lineObj ? line : e.lineNo(line), span.from);
                    if (side == -1)
                        return from;
                }
                if (span.to != null) {
                    to = d.Pos(lineObj ? line : e.lineNo(line), span.to);
                    if (side == 1)
                        return to;
                }
            }
            return from && {
                from: from,
                to: to
            };
        }
        changed() {
            let pos = this.find(-1, true), widget = this, cm = this.doc.cm;
            if (!pos || !cm)
                return;
            c.runInOp(cm, () => {
                let line = pos.line, lineN = e.lineNo(pos.line);
                let view = f.findViewForLine(cm, lineN);
                if (view) {
                    f.clearLineMeasurementCacheFor(view);
                    cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
                }
                cm.curOp.updateMaxLine = true;
                if (!h.lineIsHidden(widget.doc, line) && widget.height != null) {
                    let oldHeight = widget.height;
                    widget.height = null;
                    let dHeight = k.widgetHeight(widget) - oldHeight;
                    if (dHeight)
                        e.updateLineHeight(line, line.height + dHeight);
                }
                j.signalLater(cm, 'markerChanged', cm, this);
            });
        }
        attachLine(line) {
            if (!this.lines.length && this.doc.cm) {
                let op = this.doc.cm.curOp;
                if (!op.maybeHiddenMarkers || i.indexOf(op.maybeHiddenMarkers, this) == -1)
                    (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
            }
            this.lines.push(line);
        }
        detachLine(line) {
            this.lines.splice(i.indexOf(this.lines, line), 1);
            if (!this.lines.length && this.doc.cm) {
                let op = this.doc.cm.curOp;
                (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
            }
        }
    }
    b.eventMixin(TextMarker);
    function markText(doc, from, to, options, type) {
        if (options && options.shared)
            return markTextShared(doc, from, to, options, type);
        if (doc.cm && !doc.cm.curOp)
            return c.operation(doc.cm, markText)(doc, from, to, options, type);
        let marker = new TextMarker(doc, type), diff = d.cmp(from, to);
        if (options)
            i.copyObj(options, marker, false);
        if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
            return marker;
        if (marker.replacedWith) {
            marker.collapsed = true;
            marker.widgetNode = a.eltP('span', [marker.replacedWith], 'CodeMirror-widget');
            if (!options.handleMouseEvents)
                marker.widgetNode.setAttribute('cm-ignore-events', 'true');
            if (options.insertLeft)
                marker.widgetNode.insertLeft = true;
        }
        if (marker.collapsed) {
            if (h.conflictingCollapsedRange(doc, from.line, from, to, marker) || from.line != to.line && h.conflictingCollapsedRange(doc, to.line, from, to, marker))
                throw new Error('Inserting collapsed marker partially overlapping an existing one');
            g.seeCollapsedSpans();
        }
        if (marker.addToHistory)
            n.addChangeToHistory(doc, {
                from: from,
                to: to,
                origin: 'markText'
            }, doc.sel, NaN);
        let curLine = from.line, cm = doc.cm, updateMaxLine;
        doc.iter(curLine, to.line + 1, line => {
            if (cm && marker.collapsed && !cm.options.lineWrapping && h.visualLine(line) == cm.display.maxLine)
                updateMaxLine = true;
            if (marker.collapsed && curLine != from.line)
                e.updateLineHeight(line, 0);
            h.addMarkedSpan(line, new h.MarkedSpan(marker, curLine == from.line ? from.ch : null, curLine == to.line ? to.ch : null));
            ++curLine;
        });
        if (marker.collapsed)
            doc.iter(from.line, to.line + 1, line => {
                if (h.lineIsHidden(doc, line))
                    e.updateLineHeight(line, 0);
            });
        if (marker.clearOnEnter)
            b.on(marker, 'beforeCursorEnter', () => marker.clear());
        if (marker.readOnly) {
            g.seeReadOnlySpans();
            if (doc.history.done.length || doc.history.undone.length)
                doc.clearHistory();
        }
        if (marker.collapsed) {
            marker.id = ++nextMarkerId;
            marker.atomic = true;
        }
        if (cm) {
            if (updateMaxLine)
                cm.curOp.updateMaxLine = true;
            if (marker.collapsed)
                l.regChange(cm, from.line, to.line + 1);
            else if (marker.className || marker.startStyle || marker.endStyle || marker.css || marker.attributes || marker.title)
                for (let i = from.line; i <= to.line; i++)
                    l.regLineChange(cm, i, 'text');
            if (marker.atomic)
                o.reCheckSelection(cm.doc);
            j.signalLater(cm, 'markerAdded', cm, marker);
        }
        return marker;
    }
    class SharedTextMarker {
        constructor(markers, primary) {
            this.markers = markers;
            this.primary = primary;
            for (let i = 0; i < markers.length; ++i)
                markers[i].parent = this;
        }
        clear() {
            if (this.explicitlyCleared)
                return;
            this.explicitlyCleared = true;
            for (let i = 0; i < this.markers.length; ++i)
                this.markers[i].clear();
            j.signalLater(this, 'clear');
        }
        find(side, lineObj) {
            return this.primary.find(side, lineObj);
        }
    }
    b.eventMixin(SharedTextMarker);
    function markTextShared(doc, from, to, options, type) {
        options = i.copyObj(options);
        options.shared = false;
        let markers = [markText(doc, from, to, options, type)], primary = markers[0];
        let widget = options.widgetNode;
        m.linkedDocs(doc, doc => {
            if (widget)
                options.widgetNode = widget.cloneNode(true);
            markers.push(markText(doc, d.clipPos(doc, from), d.clipPos(doc, to), options, type));
            for (let i = 0; i < doc.linked.length; ++i)
                if (doc.linked[i].isParent)
                    return;
            primary = i.lst(markers);
        });
        return new SharedTextMarker(markers, primary);
    }
    function findSharedMarkers(doc) {
        return doc.findMarks(d.Pos(doc.first, 0), doc.clipPos(d.Pos(doc.lastLine())), m => m.parent);
    }
    function copySharedMarkers(doc, markers) {
        for (let i = 0; i < markers.length; i++) {
            let marker = markers[i], pos = marker.find();
            let mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
            if (d.cmp(mFrom, mTo)) {
                let subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
                marker.markers.push(subMark);
                subMark.parent = marker;
            }
        }
    }
    function detachSharedMarkers(markers) {
        for (let i = 0; i < markers.length; i++) {
            let marker = markers[i], linked = [marker.primary.doc];
            m.linkedDocs(marker.primary.doc, d => linked.push(d));
            for (let j = 0; j < marker.markers.length; j++) {
                let subMarker = marker.markers[j];
                if (i.indexOf(linked, subMarker.doc) == -1) {
                    subMarker.parent = null;
                    marker.markers.splice(j--, 1);
                }
            }
        }
    }
    return {
        TextMarker: TextMarker,
        markText: markText,
        SharedTextMarker: SharedTextMarker,
        findSharedMarkers: findSharedMarkers,
        copySharedMarkers: copySharedMarkers,
        detachSharedMarkers: detachSharedMarkers
    };
});
define('skylark-codemirror/primitives/model/Doc',[
    '../display/operations',
    '../line/line_data',
    '../line/pos',
    '../line/spans',
    '../line/utils_line',
    '../util/dom',
    '../util/feature_detection',
    '../util/misc',
    '../display/scrolling',
    './changes',
    './change_measurement',
    './chunk',
    './document_data',
    './history',
    './line_widget',
    './mark_text',
    './selection',
    './selection_updates'
], function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r) {
    'use strict';
    let nextDocId = 0;
    let Doc = function (text, mode, firstLine, lineSep, direction) {
        if (!(this instanceof Doc))
            return new Doc(text, mode, firstLine, lineSep, direction);
        if (firstLine == null)
            firstLine = 0;
        l.BranchChunk.call(this, [new l.LeafChunk([new b.Line('', null)])]);
        this.first = firstLine;
        this.scrollTop = this.scrollLeft = 0;
        this.cantEdit = false;
        this.cleanGeneration = 1;
        this.modeFrontier = this.highlightFrontier = firstLine;
        let start = c.Pos(firstLine, 0);
        this.sel = q.simpleSelection(start);
        this.history = new n.History(null);
        this.id = ++nextDocId;
        this.modeOption = mode;
        this.lineSep = lineSep;
        this.direction = direction == 'rtl' ? 'rtl' : 'ltr';
        this.extend = false;
        if (typeof text == 'string')
            text = this.splitLines(text);
        m.updateDoc(this, {
            from: start,
            to: start,
            text: text
        });
        r.setSelection(this, q.simpleSelection(start), h.sel_dontScroll);
    };
    Doc.prototype = h.createObj(l.BranchChunk.prototype, {
        constructor: Doc,
        iter: function (from, to, op) {
            if (op)
                this.iterN(from - this.first, to - from, op);
            else
                this.iterN(this.first, this.first + this.size, from);
        },
        insert: function (at, lines) {
            let height = 0;
            for (let i = 0; i < lines.length; ++i)
                height += lines[i].height;
            this.insertInner(at - this.first, lines, height);
        },
        remove: function (at, n) {
            this.removeInner(at - this.first, n);
        },
        getValue: function (lineSep) {
            let lines = e.getLines(this, this.first, this.first + this.size);
            if (lineSep === false)
                return lines;
            return lines.join(lineSep || this.lineSeparator());
        },
        setValue: a.docMethodOp(function (code) {
            let top = c.Pos(this.first, 0), last = this.first + this.size - 1;
            j.makeChange(this, {
                from: top,
                to: c.Pos(last, e.getLine(this, last).text.length),
                text: this.splitLines(code),
                origin: 'setValue',
                full: true
            }, true);
            if (this.cm)
                i.scrollToCoords(this.cm, 0, 0);
            r.setSelection(this, q.simpleSelection(top), h.sel_dontScroll);
        }),
        replaceRange: function (code, from, to, origin) {
            from = c.clipPos(this, from);
            to = to ? c.clipPos(this, to) : from;
            j.replaceRange(this, code, from, to, origin);
        },
        getRange: function (from, to, lineSep) {
            let lines = e.getBetween(this, c.clipPos(this, from), c.clipPos(this, to));
            if (lineSep === false)
                return lines;
            return lines.join(lineSep || this.lineSeparator());
        },
        getLine: function (line) {
            let l = this.getLineHandle(line);
            return l && l.text;
        },
        getLineHandle: function (line) {
            if (e.isLine(this, line))
                return e.getLine(this, line);
        },
        getLineNumber: function (line) {
            return e.lineNo(line);
        },
        getLineHandleVisualStart: function (line) {
            if (typeof line == 'number')
                line = e.getLine(this, line);
            return d.visualLine(line);
        },
        lineCount: function () {
            return this.size;
        },
        firstLine: function () {
            return this.first;
        },
        lastLine: function () {
            return this.first + this.size - 1;
        },
        clipPos: function (pos) {
            return c.clipPos(this, pos);
        },
        getCursor: function (start) {
            let range = this.sel.primary(), pos;
            if (start == null || start == 'head')
                pos = range.head;
            else if (start == 'anchor')
                pos = range.anchor;
            else if (start == 'end' || start == 'to' || start === false)
                pos = range.to();
            else
                pos = range.from();
            return pos;
        },
        listSelections: function () {
            return this.sel.ranges;
        },
        somethingSelected: function () {
            return this.sel.somethingSelected();
        },
        setCursor: a.docMethodOp(function (line, ch, options) {
            r.setSimpleSelection(this, c.clipPos(this, typeof line == 'number' ? c.Pos(line, ch || 0) : line), null, options);
        }),
        setSelection: a.docMethodOp(function (anchor, head, options) {
            r.setSimpleSelection(this, c.clipPos(this, anchor), c.clipPos(this, head || anchor), options);
        }),
        extendSelection: a.docMethodOp(function (head, other, options) {
            r.extendSelection(this, c.clipPos(this, head), other && c.clipPos(this, other), options);
        }),
        extendSelections: a.docMethodOp(function (heads, options) {
            r.extendSelections(this, c.clipPosArray(this, heads), options);
        }),
        extendSelectionsBy: a.docMethodOp(function (f, options) {
            let heads = h.map(this.sel.ranges, f);
            r.extendSelections(this, c.clipPosArray(this, heads), options);
        }),
        setSelections: a.docMethodOp(function (ranges, primary, options) {
            if (!ranges.length)
                return;
            let out = [];
            for (let i = 0; i < ranges.length; i++)
                out[i] = new q.Range(c.clipPos(this, ranges[i].anchor), c.clipPos(this, ranges[i].head));
            if (primary == null)
                primary = Math.min(ranges.length - 1, this.sel.primIndex);
            r.setSelection(this, q.normalizeSelection(this.cm, out, primary), options);
        }),
        addSelection: a.docMethodOp(function (anchor, head, options) {
            let ranges = this.sel.ranges.slice(0);
            ranges.push(new q.Range(c.clipPos(this, anchor), c.clipPos(this, head || anchor)));
            r.setSelection(this, q.normalizeSelection(this.cm, ranges, ranges.length - 1), options);
        }),
        getSelection: function (lineSep) {
            let ranges = this.sel.ranges, lines;
            for (let i = 0; i < ranges.length; i++) {
                let sel = e.getBetween(this, ranges[i].from(), ranges[i].to());
                lines = lines ? lines.concat(sel) : sel;
            }
            if (lineSep === false)
                return lines;
            else
                return lines.join(lineSep || this.lineSeparator());
        },
        getSelections: function (lineSep) {
            let parts = [], ranges = this.sel.ranges;
            for (let i = 0; i < ranges.length; i++) {
                let sel = e.getBetween(this, ranges[i].from(), ranges[i].to());
                if (lineSep !== false)
                    sel = sel.join(lineSep || this.lineSeparator());
                parts[i] = sel;
            }
            return parts;
        },
        replaceSelection: function (code, collapse, origin) {
            let dup = [];
            for (let i = 0; i < this.sel.ranges.length; i++)
                dup[i] = code;
            this.replaceSelections(dup, collapse, origin || '+input');
        },
        replaceSelections: a.docMethodOp(function (code, collapse, origin) {
            let changes = [], sel = this.sel;
            for (let i = 0; i < sel.ranges.length; i++) {
                let range = sel.ranges[i];
                changes[i] = {
                    from: range.from(),
                    to: range.to(),
                    text: this.splitLines(code[i]),
                    origin: origin
                };
            }
            let newSel = collapse && collapse != 'end' && k.computeReplacedSel(this, changes, collapse);
            for (let i = changes.length - 1; i >= 0; i--)
                j.makeChange(this, changes[i]);
            if (newSel)
                r.setSelectionReplaceHistory(this, newSel);
            else if (this.cm)
                i.ensureCursorVisible(this.cm);
        }),
        undo: a.docMethodOp(function () {
            j.makeChangeFromHistory(this, 'undo');
        }),
        redo: a.docMethodOp(function () {
            j.makeChangeFromHistory(this, 'redo');
        }),
        undoSelection: a.docMethodOp(function () {
            j.makeChangeFromHistory(this, 'undo', true);
        }),
        redoSelection: a.docMethodOp(function () {
            j.makeChangeFromHistory(this, 'redo', true);
        }),
        setExtending: function (val) {
            this.extend = val;
        },
        getExtending: function () {
            return this.extend;
        },
        historySize: function () {
            let hist = this.history, done = 0, undone = 0;
            for (let i = 0; i < hist.done.length; i++)
                if (!hist.done[i].ranges)
                    ++done;
            for (let i = 0; i < hist.undone.length; i++)
                if (!hist.undone[i].ranges)
                    ++undone;
            return {
                undo: done,
                redo: undone
            };
        },
        clearHistory: function () {
            this.history = new n.History(this.history.maxGeneration);
        },
        markClean: function () {
            this.cleanGeneration = this.changeGeneration(true);
        },
        changeGeneration: function (forceSplit) {
            if (forceSplit)
                this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;
            return this.history.generation;
        },
        isClean: function (gen) {
            return this.history.generation == (gen || this.cleanGeneration);
        },
        getHistory: function () {
            return {
                done: n.copyHistoryArray(this.history.done),
                undone: n.copyHistoryArray(this.history.undone)
            };
        },
        setHistory: function (histData) {
            let hist = this.history = new n.History(this.history.maxGeneration);
            hist.done = n.copyHistoryArray(histData.done.slice(0), null, true);
            hist.undone = n.copyHistoryArray(histData.undone.slice(0), null, true);
        },
        setGutterMarker: a.docMethodOp(function (line, gutterID, value) {
            return j.changeLine(this, line, 'gutter', line => {
                let markers = line.gutterMarkers || (line.gutterMarkers = {});
                markers[gutterID] = value;
                if (!value && h.isEmpty(markers))
                    line.gutterMarkers = null;
                return true;
            });
        }),
        clearGutter: a.docMethodOp(function (gutterID) {
            this.iter(line => {
                if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
                    j.changeLine(this, line, 'gutter', () => {
                        line.gutterMarkers[gutterID] = null;
                        if (h.isEmpty(line.gutterMarkers))
                            line.gutterMarkers = null;
                        return true;
                    });
                }
            });
        }),
        lineInfo: function (line) {
            let n;
            if (typeof line == 'number') {
                if (!e.isLine(this, line))
                    return null;
                n = line;
                line = e.getLine(this, line);
                if (!line)
                    return null;
            } else {
                n = e.lineNo(line);
                if (n == null)
                    return null;
            }
            return {
                line: n,
                handle: line,
                text: line.text,
                gutterMarkers: line.gutterMarkers,
                textClass: line.textClass,
                bgClass: line.bgClass,
                wrapClass: line.wrapClass,
                widgets: line.widgets
            };
        },
        addLineClass: a.docMethodOp(function (handle, where, cls) {
            return j.changeLine(this, handle, where == 'gutter' ? 'gutter' : 'class', line => {
                let prop = where == 'text' ? 'textClass' : where == 'background' ? 'bgClass' : where == 'gutter' ? 'gutterClass' : 'wrapClass';
                if (!line[prop])
                    line[prop] = cls;
                else if (f.classTest(cls).test(line[prop]))
                    return false;
                else
                    line[prop] += ' ' + cls;
                return true;
            });
        }),
        removeLineClass: a.docMethodOp(function (handle, where, cls) {
            return j.changeLine(this, handle, where == 'gutter' ? 'gutter' : 'class', line => {
                let prop = where == 'text' ? 'textClass' : where == 'background' ? 'bgClass' : where == 'gutter' ? 'gutterClass' : 'wrapClass';
                let cur = line[prop];
                if (!cur)
                    return false;
                else if (cls == null)
                    line[prop] = null;
                else {
                    let found = cur.match(f.classTest(cls));
                    if (!found)
                        return false;
                    let end = found.index + found[0].length;
                    line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? '' : ' ') + cur.slice(end) || null;
                }
                return true;
            });
        }),
        addLineWidget: a.docMethodOp(function (handle, node, options) {
            return o.addLineWidget(this, handle, node, options);
        }),
        removeLineWidget: function (widget) {
            widget.clear();
        },
        markText: function (from, to, options) {
            return p.markText(this, c.clipPos(this, from), c.clipPos(this, to), options, options && options.type || 'range');
        },
        setBookmark: function (pos, options) {
            let realOpts = {
                replacedWith: options && (options.nodeType == null ? options.widget : options),
                insertLeft: options && options.insertLeft,
                clearWhenEmpty: false,
                shared: options && options.shared,
                handleMouseEvents: options && options.handleMouseEvents
            };
            pos = c.clipPos(this, pos);
            return p.markText(this, pos, pos, realOpts, 'bookmark');
        },
        findMarksAt: function (pos) {
            pos = c.clipPos(this, pos);
            let markers = [], spans = e.getLine(this, pos.line).markedSpans;
            if (spans)
                for (let i = 0; i < spans.length; ++i) {
                    let span = spans[i];
                    if ((span.from == null || span.from <= pos.ch) && (span.to == null || span.to >= pos.ch))
                        markers.push(span.marker.parent || span.marker);
                }
            return markers;
        },
        findMarks: function (from, to, filter) {
            from = c.clipPos(this, from);
            to = c.clipPos(this, to);
            let found = [], lineNo = from.line;
            this.iter(from.line, to.line + 1, line => {
                let spans = line.markedSpans;
                if (spans)
                    for (let i = 0; i < spans.length; i++) {
                        let span = spans[i];
                        if (!(span.to != null && lineNo == from.line && from.ch >= span.to || span.from == null && lineNo != from.line || span.from != null && lineNo == to.line && span.from >= to.ch) && (!filter || filter(span.marker)))
                            found.push(span.marker.parent || span.marker);
                    }
                ++lineNo;
            });
            return found;
        },
        getAllMarks: function () {
            let markers = [];
            this.iter(line => {
                let sps = line.markedSpans;
                if (sps)
                    for (let i = 0; i < sps.length; ++i)
                        if (sps[i].from != null)
                            markers.push(sps[i].marker);
            });
            return markers;
        },
        posFromIndex: function (off) {
            let ch, lineNo = this.first, sepSize = this.lineSeparator().length;
            this.iter(line => {
                let sz = line.text.length + sepSize;
                if (sz > off) {
                    ch = off;
                    return true;
                }
                off -= sz;
                ++lineNo;
            });
            return c.clipPos(this, c.Pos(lineNo, ch));
        },
        indexFromPos: function (coords) {
            coords = c.clipPos(this, coords);
            let index = coords.ch;
            if (coords.line < this.first || coords.ch < 0)
                return 0;
            let sepSize = this.lineSeparator().length;
            this.iter(this.first, coords.line, line => {
                index += line.text.length + sepSize;
            });
            return index;
        },
        copy: function (copyHistory) {
            let doc = new Doc(e.getLines(this, this.first, this.first + this.size), this.modeOption, this.first, this.lineSep, this.direction);
            doc.scrollTop = this.scrollTop;
            doc.scrollLeft = this.scrollLeft;
            doc.sel = this.sel;
            doc.extend = false;
            if (copyHistory) {
                doc.history.undoDepth = this.history.undoDepth;
                doc.setHistory(this.getHistory());
            }
            return doc;
        },
        linkedDoc: function (options) {
            if (!options)
                options = {};
            let from = this.first, to = this.first + this.size;
            if (options.from != null && options.from > from)
                from = options.from;
            if (options.to != null && options.to < to)
                to = options.to;
            let copy = new Doc(e.getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep, this.direction);
            if (options.sharedHist)
                copy.history = this.history;
            (this.linked || (this.linked = [])).push({
                doc: copy,
                sharedHist: options.sharedHist
            });
            copy.linked = [{
                    doc: this,
                    isParent: true,
                    sharedHist: options.sharedHist
                }];
            p.copySharedMarkers(copy, p.findSharedMarkers(this));
            return copy;
        },
        unlinkDoc: function (other) {
            //if (other instanceof CodeMirror) // modified by lwf
            if (other.doc)
                other = other.doc;
            if (this.linked)
                for (let i = 0; i < this.linked.length; ++i) {
                    let link = this.linked[i];
                    if (link.doc != other)
                        continue;
                    this.linked.splice(i, 1);
                    other.unlinkDoc(this);
                    p.detachSharedMarkers(p.findSharedMarkers(this));
                    break;
                }
            if (other.history == this.history) {
                let splitIds = [other.id];
                m.linkedDocs(other, doc => splitIds.push(doc.id), true);
                other.history = new n.History(null);
                other.history.done = n.copyHistoryArray(this.history.done, splitIds);
                other.history.undone = n.copyHistoryArray(this.history.undone, splitIds);
            }
        },
        iterLinkedDocs: function (f) {
            m.linkedDocs(this, f);
        },
        getMode: function () {
            return this.mode;
        },
        getEditor: function () {
            return this.cm;
        },
        splitLines: function (str) {
            if (this.lineSep)
                return str.split(this.lineSep);
            return g.splitLinesAuto(str);
        },
        lineSeparator: function () {
            return this.lineSep || '\n';
        },
        setDirection: a.docMethodOp(function (dir) {
            if (dir != 'rtl')
                dir = 'ltr';
            if (dir == this.direction)
                return;
            this.direction = dir;
            this.iter(line => line.order = null);
            if (this.cm)
                m.directionChanged(this.cm);
        })
    });
    Doc.prototype.eachLine = Doc.prototype.iter;
    return Doc;
});
define('skylark-codemirror/primitives/edit/drop_events',[
    '../display/selection',
    '../display/operations',
    '../line/pos',
    '../measurement/position_measurement',
    '../measurement/widgets',
    '../model/changes',
    '../model/change_measurement',
    '../model/selection',
    '../model/selection_updates',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/misc'
], function (a, b, c, d, e, f, g, h, i, j, k, l, m) {
    'use strict';
    let lastDrop = 0;
    function onDrop(e) {
        let cm = this;
        clearDragCursor(cm);
        if (l.signalDOMEvent(cm, e) || e.eventInWidget(cm.display, e))
            return;
        l.e_preventDefault(e);
        if (j.ie)
            lastDrop = +new Date();
        let pos = d.posFromMouse(cm, e, true), files = e.dataTransfer.files;
        if (!pos || cm.isReadOnly())
            return;
        if (files && files.length && window.FileReader && window.File) {
            let n = files.length, text = Array(n), read = 0;
            let loadFile = (file, i) => {
                if (cm.options.allowDropFileTypes && m.indexOf(cm.options.allowDropFileTypes, file.type) == -1)
                    return;
                let reader = new FileReader();
                reader.onload = b.operation(cm, () => {
                    let content = reader.result;
                    if (/[\x00-\x08\x0e-\x1f]{2}/.test(content))
                        content = '';
                    text[i] = content;
                    if (++read == n) {
                        pos = c.clipPos(cm.doc, pos);
                        let change = {
                            from: pos,
                            to: pos,
                            text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                            origin: 'paste'
                        };
                        f.makeChange(cm.doc, change);
                        i.setSelectionReplaceHistory(cm.doc, h.simpleSelection(pos, g.changeEnd(change)));
                    }
                });
                reader.readAsText(file);
            };
            for (let i = 0; i < n; ++i)
                loadFile(files[i], i);
        } else {
            if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
                cm.state.draggingText(e);
                setTimeout(() => cm.display.input.focus(), 20);
                return;
            }
            try {
                let text = e.dataTransfer.getData('Text');
                if (text) {
                    let selected;
                    if (cm.state.draggingText && !cm.state.draggingText.copy)
                        selected = cm.listSelections();
                    i.setSelectionNoUndo(cm.doc, h.simpleSelection(pos, pos));
                    if (selected)
                        for (let i = 0; i < selected.length; ++i)
                            f.replaceRange(cm.doc, '', selected[i].anchor, selected[i].head, 'drag');
                    cm.replaceSelection(text, 'around', 'paste');
                    cm.display.input.focus();
                }
            } catch (e) {
            }
        }
    }
    function onDragStart(cm, e) {
        if (j.ie && (!cm.state.draggingText || +new Date() - lastDrop < 100)) {
            l.e_stop(e);
            return;
        }
        if (l.signalDOMEvent(cm, e) || e.eventInWidget(cm.display, e))
            return;
        e.dataTransfer.setData('Text', cm.getSelection());
        e.dataTransfer.effectAllowed = 'copyMove';
        if (e.dataTransfer.setDragImage && !j.safari) {
            let img = k.elt('img', null, null, 'position: fixed; left: 0; top: 0;');
            img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            if (j.presto) {
                img.width = img.height = 1;
                cm.display.wrapper.appendChild(img);
                img._top = img.offsetTop;
            }
            e.dataTransfer.setDragImage(img, 0, 0);
            if (j.presto)
                img.parentNode.removeChild(img);
        }
    }
    function onDragOver(cm, e) {
        let pos = d.posFromMouse(cm, e);
        if (!pos)
            return;
        let frag = document.createDocumentFragment();
        a.drawSelectionCursor(cm, pos, frag);
        if (!cm.display.dragCursor) {
            cm.display.dragCursor = k.elt('div', null, 'CodeMirror-cursors CodeMirror-dragcursors');
            cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
        }
        k.removeChildrenAndAdd(cm.display.dragCursor, frag);
    }
    function clearDragCursor(cm) {
        if (cm.display.dragCursor) {
            cm.display.lineSpace.removeChild(cm.display.dragCursor);
            cm.display.dragCursor = null;
        }
    }
    return {
        onDrop: onDrop,
        onDragStart: onDragStart,
        onDragOver: onDragOver,
        clearDragCursor: clearDragCursor
    };
});
define('skylark-codemirror/primitives/edit/global_events',[
    '../display/focus',
    '../util/event'
], function (focuses, events) {
    'use strict';
    function forEachCodeMirror(f) {
        if (!document.getElementsByClassName)
            return;
        let byClass = document.getElementsByClassName('CodeMirror'), editors = [];
        for (let i = 0; i < byClass.length; i++) {
            let cm = byClass[i].CodeMirror;
            if (cm)
                editors.push(cm);
        }
        if (editors.length)
            editors[0].operation(() => {
                for (let i = 0; i < editors.length; i++)
                    f(editors[i]);
            });
    }
    let globalsRegistered = false;
    function ensureGlobalHandlers() {
        if (globalsRegistered)
            return;
        registerGlobalHandlers();
        globalsRegistered = true;
    }
    function registerGlobalHandlers() {
        let resizeTimer;
        events.on(window, 'resize', () => {
            if (resizeTimer == null)
                resizeTimer = setTimeout(() => {
                    resizeTimer = null;
                    forEachCodeMirror(onResize);
                }, 100);
        });
        events.on(window, 'blur', () => forEachCodeMirror(focuses.onBlur));
    }
    function onResize(cm) {
        let d = cm.display;
        d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
        d.scrollbarsClipped = false;
        cm.setSize();
    }
    return { ensureGlobalHandlers: ensureGlobalHandlers };
});
define('skylark-codemirror/primitives/input/keynames',[],function () {
    'use strict';
    let keyNames = {
        3: 'Pause',
        8: 'Backspace',
        9: 'Tab',
        13: 'Enter',
        16: 'Shift',
        17: 'Ctrl',
        18: 'Alt',
        19: 'Pause',
        20: 'CapsLock',
        27: 'Esc',
        32: 'Space',
        33: 'PageUp',
        34: 'PageDown',
        35: 'End',
        36: 'Home',
        37: 'Left',
        38: 'Up',
        39: 'Right',
        40: 'Down',
        44: 'PrintScrn',
        45: 'Insert',
        46: 'Delete',
        59: ';',
        61: '=',
        91: 'Mod',
        92: 'Mod',
        93: 'Mod',
        106: '*',
        107: '=',
        109: '-',
        110: '.',
        111: '/',
        127: 'Delete',
        145: 'ScrollLock',
        173: '-',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: "'",
        63232: 'Up',
        63233: 'Down',
        63234: 'Left',
        63235: 'Right',
        63272: 'Delete',
        63273: 'Home',
        63275: 'End',
        63276: 'PageUp',
        63277: 'PageDown',
        63302: 'Insert'
    };
    for (let i = 0; i < 10; i++)
        keyNames[i + 48] = keyNames[i + 96] = String(i);
    for (let i = 65; i <= 90; i++)
        keyNames[i] = String.fromCharCode(i);
    for (let i = 1; i <= 12; i++)
        keyNames[i + 111] = keyNames[i + 63235] = 'F' + i;
    return { keyNames: keyNames };
});
define('skylark-codemirror/primitives/input/keymap',[
    '../util/browser',
    '../util/misc',
    './keynames'
], function (browser, misc, keynames) {
    'use strict';
    let keyMap = {};
    keyMap.basic = {
        'Left': 'goCharLeft',
        'Right': 'goCharRight',
        'Up': 'goLineUp',
        'Down': 'goLineDown',
        'End': 'goLineEnd',
        'Home': 'goLineStartSmart',
        'PageUp': 'goPageUp',
        'PageDown': 'goPageDown',
        'Delete': 'delCharAfter',
        'Backspace': 'delCharBefore',
        'Shift-Backspace': 'delCharBefore',
        'Tab': 'defaultTab',
        'Shift-Tab': 'indentAuto',
        'Enter': 'newlineAndIndent',
        'Insert': 'toggleOverwrite',
        'Esc': 'singleSelection'
    };
    keyMap.pcDefault = {
        'Ctrl-A': 'selectAll',
        'Ctrl-D': 'deleteLine',
        'Ctrl-Z': 'undo',
        'Shift-Ctrl-Z': 'redo',
        'Ctrl-Y': 'redo',
        'Ctrl-Home': 'goDocStart',
        'Ctrl-End': 'goDocEnd',
        'Ctrl-Up': 'goLineUp',
        'Ctrl-Down': 'goLineDown',
        'Ctrl-Left': 'goGroupLeft',
        'Ctrl-Right': 'goGroupRight',
        'Alt-Left': 'goLineStart',
        'Alt-Right': 'goLineEnd',
        'Ctrl-Backspace': 'delGroupBefore',
        'Ctrl-Delete': 'delGroupAfter',
        'Ctrl-S': 'save',
        'Ctrl-F': 'find',
        'Ctrl-G': 'findNext',
        'Shift-Ctrl-G': 'findPrev',
        'Shift-Ctrl-F': 'replace',
        'Shift-Ctrl-R': 'replaceAll',
        'Ctrl-[': 'indentLess',
        'Ctrl-]': 'indentMore',
        'Ctrl-U': 'undoSelection',
        'Shift-Ctrl-U': 'redoSelection',
        'Alt-U': 'redoSelection',
        'fallthrough': 'basic'
    };
    keyMap.emacsy = {
        'Ctrl-F': 'goCharRight',
        'Ctrl-B': 'goCharLeft',
        'Ctrl-P': 'goLineUp',
        'Ctrl-N': 'goLineDown',
        'Alt-F': 'goWordRight',
        'Alt-B': 'goWordLeft',
        'Ctrl-A': 'goLineStart',
        'Ctrl-E': 'goLineEnd',
        'Ctrl-V': 'goPageDown',
        'Shift-Ctrl-V': 'goPageUp',
        'Ctrl-D': 'delCharAfter',
        'Ctrl-H': 'delCharBefore',
        'Alt-D': 'delWordAfter',
        'Alt-Backspace': 'delWordBefore',
        'Ctrl-K': 'killLine',
        'Ctrl-T': 'transposeChars',
        'Ctrl-O': 'openLine'
    };
    keyMap.macDefault = {
        'Cmd-A': 'selectAll',
        'Cmd-D': 'deleteLine',
        'Cmd-Z': 'undo',
        'Shift-Cmd-Z': 'redo',
        'Cmd-Y': 'redo',
        'Cmd-Home': 'goDocStart',
        'Cmd-Up': 'goDocStart',
        'Cmd-End': 'goDocEnd',
        'Cmd-Down': 'goDocEnd',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
        'Cmd-Left': 'goLineLeft',
        'Cmd-Right': 'goLineRight',
        'Alt-Backspace': 'delGroupBefore',
        'Ctrl-Alt-Backspace': 'delGroupAfter',
        'Alt-Delete': 'delGroupAfter',
        'Cmd-S': 'save',
        'Cmd-F': 'find',
        'Cmd-G': 'findNext',
        'Shift-Cmd-G': 'findPrev',
        'Cmd-Alt-F': 'replace',
        'Shift-Cmd-Alt-F': 'replaceAll',
        'Cmd-[': 'indentLess',
        'Cmd-]': 'indentMore',
        'Cmd-Backspace': 'delWrappedLineLeft',
        'Cmd-Delete': 'delWrappedLineRight',
        'Cmd-U': 'undoSelection',
        'Shift-Cmd-U': 'redoSelection',
        'Ctrl-Up': 'goDocStart',
        'Ctrl-Down': 'goDocEnd',
        'fallthrough': [
            'basic',
            'emacsy'
        ]
    };
    keyMap['default'] = browser.mac ? keyMap.macDefault : keyMap.pcDefault;
    function normalizeKeyName(name) {
        let parts = name.split(/-(?!$)/);
        name = parts[parts.length - 1];
        let alt, ctrl, shift, cmd;
        for (let i = 0; i < parts.length - 1; i++) {
            let mod = parts[i];
            if (/^(cmd|meta|m)$/i.test(mod))
                cmd = true;
            else if (/^a(lt)?$/i.test(mod))
                alt = true;
            else if (/^(c|ctrl|control)$/i.test(mod))
                ctrl = true;
            else if (/^s(hift)?$/i.test(mod))
                shift = true;
            else
                throw new Error('Unrecognized modifier name: ' + mod);
        }
        if (alt)
            name = 'Alt-' + name;
        if (ctrl)
            name = 'Ctrl-' + name;
        if (cmd)
            name = 'Cmd-' + name;
        if (shift)
            name = 'Shift-' + name;
        return name;
    }
    function normalizeKeyMap(keymap) {
        let copy = {};
        for (let keyname in keymap)
            if (keymap.hasOwnProperty(keyname)) {
                let value = keymap[keyname];
                if (/^(name|fallthrough|(de|at)tach)$/.test(keyname))
                    continue;
                if (value == '...') {
                    delete keymap[keyname];
                    continue;
                }
                let keys = misc.map(keyname.split(' '), normalizeKeyName);
                for (let i = 0; i < keys.length; i++) {
                    let val, name;
                    if (i == keys.length - 1) {
                        name = keys.join(' ');
                        val = value;
                    } else {
                        name = keys.slice(0, i + 1).join(' ');
                        val = '...';
                    }
                    let prev = copy[name];
                    if (!prev)
                        copy[name] = val;
                    else if (prev != val)
                        throw new Error('Inconsistent bindings for ' + name);
                }
                delete keymap[keyname];
            }
        for (let prop in copy)
            keymap[prop] = copy[prop];
        return keymap;
    }
    function lookupKey(key, map, handle, context) {
        map = getKeyMap(map);
        let found = map.call ? map.call(key, context) : map[key];
        if (found === false)
            return 'nothing';
        if (found === '...')
            return 'multi';
        if (found != null && handle(found))
            return 'handled';
        if (map.fallthrough) {
            if (Object.prototype.toString.call(map.fallthrough) != '[object Array]')
                return lookupKey(key, map.fallthrough, handle, context);
            for (let i = 0; i < map.fallthrough.length; i++) {
                let result = lookupKey(key, map.fallthrough[i], handle, context);
                if (result)
                    return result;
            }
        }
    }
    function isModifierKey(value) {
        let name = typeof value == 'string' ? value : keynames.keyNames[value.keyCode];
        return name == 'Ctrl' || name == 'Alt' || name == 'Shift' || name == 'Mod';
    }
    function addModifierNames(name, event, noShift) {
        let base = name;
        if (event.altKey && base != 'Alt')
            name = 'Alt-' + name;
        if ((browser.flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != 'Ctrl')
            name = 'Ctrl-' + name;
        if ((browser.flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != 'Cmd')
            name = 'Cmd-' + name;
        if (!noShift && event.shiftKey && base != 'Shift')
            name = 'Shift-' + name;
        return name;
    }
    function keyName(event, noShift) {
        if (browser.presto && event.keyCode == 34 && event['char'])
            return false;
        let name = keynames.keyNames[event.keyCode];
        if (name == null || event.altGraphKey)
            return false;
        if (event.keyCode == 3 && event.code)
            name = event.code;
        return addModifierNames(name, event, noShift);
    }
    function getKeyMap(val) {
        return typeof val == 'string' ? keyMap[val] : val;
    }
    return {
        keyMap: keyMap,
        normalizeKeyMap: normalizeKeyMap,
        lookupKey: lookupKey,
        isModifierKey: isModifierKey,
        addModifierNames: addModifierNames,
        keyName: keyName,
        getKeyMap: getKeyMap
    };
});
define('skylark-codemirror/primitives/edit/deleteNearSelection',[
    '../display/operations',
    '../display/scrolling',
    '../line/pos',
    '../model/changes',
    '../util/misc'
], function (operations, scrolling, line_pos, changes, misc) {
    'use strict';
    function deleteNearSelection(cm, compute) {
        let ranges = cm.doc.sel.ranges, kill = [];
        for (let i = 0; i < ranges.length; i++) {
            let toKill = compute(ranges[i]);
            while (kill.length && line_pos.cmp(toKill.from, misc.lst(kill).to) <= 0) {
                let replaced = kill.pop();
                if (line_pos.cmp(replaced.from, toKill.from) < 0) {
                    toKill.from = replaced.from;
                    break;
                }
            }
            kill.push(toKill);
        }
        operations.runInOp(cm, () => {
            for (let i = kill.length - 1; i >= 0; i--)
                changes.replaceRange(cm.doc, '', kill[i].from, kill[i].to, '+delete');
            scrolling.ensureCursorVisible(cm);
        });
    }
    return { deleteNearSelection: deleteNearSelection };
});
define('skylark-codemirror/primitives/input/movement',[
    '../line/pos',
    '../measurement/position_measurement',
    '../util/bidi',
    '../util/misc'
], function (line_pos, position_measurement, bidi, misc) {
    'use strict';
    function moveCharLogically(line, ch, dir) {
        let target = misc.skipExtendingChars(line.text, ch + dir, dir);
        return target < 0 || target > line.text.length ? null : target;
    }
    function moveLogically(line, start, dir) {
        let ch = moveCharLogically(line, start.ch, dir);
        return ch == null ? null : new line_pos.Pos(start.line, ch, dir < 0 ? 'after' : 'before');
    }
    function endOfLine(visually, cm, lineObj, lineNo, dir) {
        if (visually) {
            let order = bidi.getOrder(lineObj, cm.doc.direction);
            if (order) {
                let part = dir < 0 ? misc.lst(order) : order[0];
                let moveInStorageOrder = dir < 0 == (part.level == 1);
                let sticky = moveInStorageOrder ? 'after' : 'before';
                let ch;
                if (part.level > 0 || cm.doc.direction == 'rtl') {
                    let prep = position_measurement.prepareMeasureForLine(cm, lineObj);
                    ch = dir < 0 ? lineObj.text.length - 1 : 0;
                    let targetTop = position_measurement.measureCharPrepared(cm, prep, ch).top;
                    ch = misc.findFirst(ch => position_measurement.measureCharPrepared(cm, prep, ch).top == targetTop, dir < 0 == (part.level == 1) ? part.from : part.to - 1, ch);
                    if (sticky == 'before')
                        ch = moveCharLogically(lineObj, ch, 1);
                } else
                    ch = dir < 0 ? part.to : part.from;
                return new line_pos.Pos(lineNo, ch, sticky);
            }
        }
        return new line_pos.Pos(lineNo, dir < 0 ? lineObj.text.length : 0, dir < 0 ? 'before' : 'after');
    }
    function moveVisually(cm, line, start, dir) {
        let bidi = bidi.getOrder(line, cm.doc.direction);
        if (!bidi)
            return moveLogically(line, start, dir);
        if (start.ch >= line.text.length) {
            start.ch = line.text.length;
            start.sticky = 'before';
        } else if (start.ch <= 0) {
            start.ch = 0;
            start.sticky = 'after';
        }
        let partPos = bidi.getBidiPartAt(bidi, start.ch, start.sticky), part = bidi[partPos];
        if (cm.doc.direction == 'ltr' && part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
            return moveLogically(line, start, dir);
        }
        let mv = (pos, dir) => moveCharLogically(line, pos instanceof line_pos.Pos ? pos.ch : pos, dir);
        let prep;
        let getWrappedLineExtent = ch => {
            if (!cm.options.lineWrapping)
                return {
                    begin: 0,
                    end: line.text.length
                };
            prep = prep || position_measurement.prepareMeasureForLine(cm, line);
            return position_measurement.wrappedLineExtentChar(cm, line, prep, ch);
        };
        let wrappedLineExtent = getWrappedLineExtent(start.sticky == 'before' ? mv(start, -1) : start.ch);
        if (cm.doc.direction == 'rtl' || part.level == 1) {
            let moveInStorageOrder = part.level == 1 == dir < 0;
            let ch = mv(start, moveInStorageOrder ? 1 : -1);
            if (ch != null && (!moveInStorageOrder ? ch >= part.from && ch >= wrappedLineExtent.begin : ch <= part.to && ch <= wrappedLineExtent.end)) {
                let sticky = moveInStorageOrder ? 'before' : 'after';
                return new line_pos.Pos(start.line, ch, sticky);
            }
        }
        let searchInVisualLine = (partPos, dir, wrappedLineExtent) => {
            let getRes = (ch, moveInStorageOrder) => moveInStorageOrder ? new line_pos.Pos(start.line, mv(ch, 1), 'before') : new line_pos.Pos(start.line, ch, 'after');
            for (; partPos >= 0 && partPos < bidi.length; partPos += dir) {
                let part = bidi[partPos];
                let moveInStorageOrder = dir > 0 == (part.level != 1);
                let ch = moveInStorageOrder ? wrappedLineExtent.begin : mv(wrappedLineExtent.end, -1);
                if (part.from <= ch && ch < part.to)
                    return getRes(ch, moveInStorageOrder);
                ch = moveInStorageOrder ? part.from : mv(part.to, -1);
                if (wrappedLineExtent.begin <= ch && ch < wrappedLineExtent.end)
                    return getRes(ch, moveInStorageOrder);
            }
        };
        let res = searchInVisualLine(partPos + dir, dir, wrappedLineExtent);
        if (res)
            return res;
        let nextCh = dir > 0 ? wrappedLineExtent.end : mv(wrappedLineExtent.begin, -1);
        if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
            res = searchInVisualLine(dir > 0 ? 0 : bidi.length - 1, dir, getWrappedLineExtent(nextCh));
            if (res)
                return res;
        }
        return null;
    }
    return {
        moveLogically: moveLogically,
        endOfLine: endOfLine,
        moveVisually: moveVisually
    };
});
define('skylark-codemirror/primitives/edit/commands',[
    './deleteNearSelection',
    '../display/operations',
    '../display/scrolling',
    '../input/movement',
    '../line/pos',
    '../line/spans',
    '../line/utils_line',
    '../model/selection',
    '../model/selection_updates',
    '../util/misc',
    '../util/bidi'
], function (a, b, c, d, e, f, g, h, i, j, k) {
    'use strict';
    let commands = {
        selectAll: i.selectAll,
        singleSelection: cm => cm.setSelection(cm.getCursor('anchor'), cm.getCursor('head'), j.sel_dontScroll),
        killLine: cm => a.deleteNearSelection(cm, range => {
            if (range.empty()) {
                let len = g.getLine(cm.doc, range.head.line).text.length;
                if (range.head.ch == len && range.head.line < cm.lastLine())
                    return {
                        from: range.head,
                        to: e.Pos(range.head.line + 1, 0)
                    };
                else
                    return {
                        from: range.head,
                        to: e.Pos(range.head.line, len)
                    };
            } else {
                return {
                    from: range.from(),
                    to: range.to()
                };
            }
        }),
        deleteLine: cm => a.deleteNearSelection(cm, range => ({
            from: e.Pos(range.from().line, 0),
            to: e.clipPos(cm.doc, e.Pos(range.to().line + 1, 0))
        })),
        delLineLeft: cm => a.deleteNearSelection(cm, range => ({
            from: e.Pos(range.from().line, 0),
            to: range.from()
        })),
        delWrappedLineLeft: cm => a.deleteNearSelection(cm, range => {
            let top = cm.charCoords(range.head, 'div').top + 5;
            let leftPos = cm.coordsChar({
                left: 0,
                top: top
            }, 'div');
            return {
                from: leftPos,
                to: range.from()
            };
        }),
        delWrappedLineRight: cm => a.deleteNearSelection(cm, range => {
            let top = cm.charCoords(range.head, 'div').top + 5;
            let rightPos = cm.coordsChar({
                left: cm.display.lineDiv.offsetWidth + 100,
                top: top
            }, 'div');
            return {
                from: range.from(),
                to: rightPos
            };
        }),
        undo: cm => cm.undo(),
        redo: cm => cm.redo(),
        undoSelection: cm => cm.undoSelection(),
        redoSelection: cm => cm.redoSelection(),
        goDocStart: cm => cm.extendSelection(e.Pos(cm.firstLine(), 0)),
        goDocEnd: cm => cm.extendSelection(e.Pos(cm.lastLine())),
        goLineStart: cm => cm.extendSelectionsBy(range => lineStart(cm, range.head.line), {
            origin: '+move',
            bias: 1
        }),
        goLineStartSmart: cm => cm.extendSelectionsBy(range => lineStartSmart(cm, range.head), {
            origin: '+move',
            bias: 1
        }),
        goLineEnd: cm => cm.extendSelectionsBy(range => lineEnd(cm, range.head.line), {
            origin: '+move',
            bias: -1
        }),
        goLineRight: cm => cm.extendSelectionsBy(range => {
            let top = cm.cursorCoords(range.head, 'div').top + 5;
            return cm.coordsChar({
                left: cm.display.lineDiv.offsetWidth + 100,
                top: top
            }, 'div');
        }, j.sel_move),
        goLineLeft: cm => cm.extendSelectionsBy(range => {
            let top = cm.cursorCoords(range.head, 'div').top + 5;
            return cm.coordsChar({
                left: 0,
                top: top
            }, 'div');
        }, j.sel_move),
        goLineLeftSmart: cm => cm.extendSelectionsBy(range => {
            let top = cm.cursorCoords(range.head, 'div').top + 5;
            let pos = cm.coordsChar({
                left: 0,
                top: top
            }, 'div');
            if (pos.ch < cm.getLine(pos.line).search(/\S/))
                return lineStartSmart(cm, range.head);
            return pos;
        }, j.sel_move),
        goLineUp: cm => cm.moveV(-1, 'line'),
        goLineDown: cm => cm.moveV(1, 'line'),
        goPageUp: cm => cm.moveV(-1, 'page'),
        goPageDown: cm => cm.moveV(1, 'page'),
        goCharLeft: cm => cm.moveH(-1, 'char'),
        goCharRight: cm => cm.moveH(1, 'char'),
        goColumnLeft: cm => cm.moveH(-1, 'column'),
        goColumnRight: cm => cm.moveH(1, 'column'),
        goWordLeft: cm => cm.moveH(-1, 'word'),
        goGroupRight: cm => cm.moveH(1, 'group'),
        goGroupLeft: cm => cm.moveH(-1, 'group'),
        goWordRight: cm => cm.moveH(1, 'word'),
        delCharBefore: cm => cm.deleteH(-1, 'char'),
        delCharAfter: cm => cm.deleteH(1, 'char'),
        delWordBefore: cm => cm.deleteH(-1, 'word'),
        delWordAfter: cm => cm.deleteH(1, 'word'),
        delGroupBefore: cm => cm.deleteH(-1, 'group'),
        delGroupAfter: cm => cm.deleteH(1, 'group'),
        indentAuto: cm => cm.indentSelection('smart'),
        indentMore: cm => cm.indentSelection('add'),
        indentLess: cm => cm.indentSelection('subtract'),
        insertTab: cm => cm.replaceSelection('\t'),
        insertSoftTab: cm => {
            let spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize;
            for (let i = 0; i < ranges.length; i++) {
                let pos = ranges[i].from();
                let col = j.countColumn(cm.getLine(pos.line), pos.ch, tabSize);
                spaces.push(j.spaceStr(tabSize - col % tabSize));
            }
            cm.replaceSelections(spaces);
        },
        defaultTab: cm => {
            if (cm.somethingSelected())
                cm.indentSelection('add');
            else
                cm.execCommand('insertTab');
        },
        transposeChars: cm => b.runInOp(cm, () => {
            let ranges = cm.listSelections(), newSel = [];
            for (let i = 0; i < ranges.length; i++) {
                if (!ranges[i].empty())
                    continue;
                let cur = ranges[i].head, line = g.getLine(cm.doc, cur.line).text;
                if (line) {
                    if (cur.ch == line.length)
                        cur = new e.Pos(cur.line, cur.ch - 1);
                    if (cur.ch > 0) {
                        cur = new e.Pos(cur.line, cur.ch + 1);
                        cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2), e.Pos(cur.line, cur.ch - 2), cur, '+transpose');
                    } else if (cur.line > cm.doc.first) {
                        let prev = g.getLine(cm.doc, cur.line - 1).text;
                        if (prev) {
                            cur = new e.Pos(cur.line, 1);
                            cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() + prev.charAt(prev.length - 1), e.Pos(cur.line - 1, prev.length - 1), cur, '+transpose');
                        }
                    }
                }
                newSel.push(new h.Range(cur, cur));
            }
            cm.setSelections(newSel);
        }),
        newlineAndIndent: cm => b.runInOp(cm, () => {
            let sels = cm.listSelections();
            for (let i = sels.length - 1; i >= 0; i--)
                cm.replaceRange(cm.doc.lineSeparator(), sels[i].anchor, sels[i].head, '+input');
            sels = cm.listSelections();
            for (let i = 0; i < sels.length; i++)
                cm.indentLine(sels[i].from().line, null, true);
            c.ensureCursorVisible(cm);
        }),
        openLine: cm => cm.replaceSelection('\n', 'start'),
        toggleOverwrite: cm => cm.toggleOverwrite()
    };
    function lineStart(cm, lineN) {
        let line = g.getLine(cm.doc, lineN);
        let visual = f.visualLine(line);
        if (visual != line)
            lineN = g.lineNo(visual);
        return d.endOfLine(true, cm, visual, lineN, 1);
    }
    function lineEnd(cm, lineN) {
        let line = g.getLine(cm.doc, lineN);
        let visual = f.visualLineEnd(line);
        if (visual != line)
            lineN = g.lineNo(visual);
        return d.endOfLine(true, cm, line, lineN, -1);
    }
    function lineStartSmart(cm, pos) {
        let start = lineStart(cm, pos.line);
        let line = g.getLine(cm.doc, start.line);
        let order = k.getOrder(line, cm.doc.direction);
        if (!order || order[0].level == 0) {
            let firstNonWS = Math.max(0, line.text.search(/\S/));
            let inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch;
            return e.Pos(start.line, inWS ? 0 : firstNonWS, start.sticky);
        }
        return start;
    }
    return { commands: commands };
});
define('skylark-codemirror/primitives/edit/key_events',[
    '../util/operation_group',
    '../display/selection',
    '../input/keymap',
    '../measurement/widgets',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/feature_detection',
    '../util/misc',
    './commands'
], function (operation_group, selection, keymap, widgets, browser, dom, events, feature_detection, misc, m_commands) {
    'use strict';
    function doHandleBinding(cm, bound, dropShift) {
        if (typeof bound == 'string') {
            bound = m_commands.commands[bound];
            if (!bound)
                return false;
        }
        cm.display.input.ensurePolled();
        let prevShift = cm.display.shift, done = false;
        try {
            if (cm.isReadOnly())
                cm.state.suppressEdits = true;
            if (dropShift)
                cm.display.shift = false;
            done = bound(cm) != misc.Pass;
        } finally {
            cm.display.shift = prevShift;
            cm.state.suppressEdits = false;
        }
        return done;
    }
    function lookupKeyForEditor(cm, name, handle) {
        for (let i = 0; i < cm.state.keyMaps.length; i++) {
            let result = keymap.lookupKey(name, cm.state.keyMaps[i], handle, cm);
            if (result)
                return result;
        }
        return cm.options.extraKeys && keymap.lookupKey(name, cm.options.extraKeys, handle, cm) || keymap.lookupKey(name, cm.options.keyMap, handle, cm);
    }
    let stopSeq = new misc.Delayed();
    function dispatchKey(cm, name, e, handle) {
        let seq = cm.state.keySeq;
        if (seq) {
            if (keymap.isModifierKey(name))
                return 'handled';
            if (/\'$/.test(name))
                cm.state.keySeq = null;
            else
                stopSeq.set(50, () => {
                    if (cm.state.keySeq == seq) {
                        cm.state.keySeq = null;
                        cm.display.input.reset();
                    }
                });
            if (dispatchKeyInner(cm, seq + ' ' + name, e, handle))
                return true;
        }
        return dispatchKeyInner(cm, name, e, handle);
    }
    function dispatchKeyInner(cm, name, e, handle) {
        let result = lookupKeyForEditor(cm, name, handle);
        if (result == 'multi')
            cm.state.keySeq = name;
        if (result == 'handled')
            operation_group.signalLater(cm, 'keyHandled', cm, name, e);
        if (result == 'handled' || result == 'multi') {
            events.e_preventDefault(e);
            selection.restartBlink(cm);
        }
        return !!result;
    }
    function handleKeyBinding(cm, e) {
        let name = keymap.keyName(e, true);
        if (!name)
            return false;
        if (e.shiftKey && !cm.state.keySeq) {
            return dispatchKey(cm, 'Shift-' + name, e, b => doHandleBinding(cm, b, true)) || dispatchKey(cm, name, e, b => {
                if (typeof b == 'string' ? /^go[A-Z]/.test(b) : b.motion)
                    return doHandleBinding(cm, b);
            });
        } else {
            return dispatchKey(cm, name, e, b => doHandleBinding(cm, b));
        }
    }
    function handleCharBinding(cm, e, ch) {
        return dispatchKey(cm, "'" + ch + "'", e, b => doHandleBinding(cm, b, true));
    }
    let lastStoppedKey = null;
    function onKeyDown(e) {
        let cm = this;
        cm.curOp.focus = dom.activeElt();
        if (events.signalDOMEvent(cm, e))
            return;
        if (browser.ie && browser.ie_version < 11 && e.keyCode == 27)
            e.returnValue = false;
        let code = e.keyCode;
        cm.display.shift = code == 16 || e.shiftKey;
        let handled = handleKeyBinding(cm, e);
        if (browser.presto) {
            lastStoppedKey = handled ? code : null;
            if (!handled && code == 88 && !feature_detection.hasCopyEvent && (browser.mac ? e.metaKey : e.ctrlKey))
                cm.replaceSelection('', null, 'cut');
        }
        if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
            showCrossHair(cm);
    }
    function showCrossHair(cm) {
        let lineDiv = cm.display.lineDiv;
        dom.addClass(lineDiv, 'CodeMirror-crosshair');
        function up(e) {
            if (e.keyCode == 18 || !e.altKey) {
                dom.rmClass(lineDiv, 'CodeMirror-crosshair');
                events.off(document, 'keyup', up);
                events.off(document, 'mouseover', up);
            }
        }
        events.on(document, 'keyup', up);
        events.on(document, 'mouseover', up);
    }
    function onKeyUp(e) {
        if (e.keyCode == 16)
            this.doc.sel.shift = false;
        events.signalDOMEvent(this, e);
    }
    function onKeyPress(e) {
        let cm = this;
        if (widgets.eventInWidget(cm.display, e) || events.signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || browser.mac && e.metaKey)
            return;
        let keyCode = e.keyCode, charCode = e.charCode;
        if (browser.presto && keyCode == lastStoppedKey) {
            lastStoppedKey = null;
            events.e_preventDefault(e);
            return;
        }
        if (browser.presto && (!e.which || e.which < 10) && handleKeyBinding(cm, e))
            return;
        let ch = String.fromCharCode(charCode == null ? keyCode : charCode);
        if (ch == '\b')
            return;
        if (handleCharBinding(cm, e, ch))
            return;
        cm.display.input.onKeyPress(e);
    }
    return {
        dispatchKey: dispatchKey,
        onKeyDown: onKeyDown,
        onKeyUp: onKeyUp,
        onKeyPress: onKeyPress
    };
});
define('skylark-codemirror/primitives/edit/mouse_events',[
    '../display/focus',
    '../display/operations',
    '../display/update_lines',
    '../line/pos',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../measurement/widgets',
    '../model/selection',
    '../model/selection_updates',
    '../util/browser',
    '../util/bidi',
    '../util/dom',
    '../util/event',
    '../util/feature_detection',
    '../util/misc',
    '../input/keymap',
    './key_events',
    './commands'
], function (focus, operations, update_lines, line_pos, utils_line, position_measurement, widgets, selection, selection_updates, browser, bidi, dom, events, n, o, p, q, r) {
    'use strict';
    const DOUBLECLICK_DELAY = 400;
    class PastClick {
        constructor(time, pos, button) {
            this.time = time;
            this.pos = pos;
            this.button = button;
        }
        compare(time, pos, button) {
            return this.time + DOUBLECLICK_DELAY > time && line_pos.cmp(pos, this.pos) == 0 && button == this.button;
        }
    }
    let lastClick, lastDoubleClick;
    function clickRepeat(pos, button) {
        let now = +new Date();
        if (lastDoubleClick && lastDoubleClick.compare(now, pos, button)) {
            lastClick = lastDoubleClick = null;
            return 'triple';
        } else if (lastClick && lastClick.compare(now, pos, button)) {
            lastDoubleClick = new PastClick(now, pos, button);
            lastClick = null;
            return 'double';
        } else {
            lastClick = new PastClick(now, pos, button);
            lastDoubleClick = null;
            return 'single';
        }
    }
    function onMouseDown(e) {
        let cm = this, display = cm.display;
        if (events.signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch())
            return;
        display.input.ensurePolled();
        display.shift = e.shiftKey;
        if (widgets.eventInWidget(display, e)) {
            if (!browser.webkit) {
                display.scroller.draggable = false;
                setTimeout(() => display.scroller.draggable = true, 100);
            }
            return;
        }
        if (clickInGutter(cm, e))
            return;
        let pos = position_measurement.posFromMouse(cm, e), button = events.e_button(e), repeat = pos ? clickRepeat(pos, button) : 'single';
        window.focus();
        if (button == 1 && cm.state.selectingText)
            cm.state.selectingText(e);
        if (pos && handleMappedButton(cm, button, pos, repeat, e))
            return;
        if (button == 1) {
            if (pos)
                leftButtonDown(cm, pos, repeat, e);
            else if (events.e_target(e) == display.scroller)
                events.e_preventDefault(e);
        } else if (button == 2) {
            if (pos)
                selection_updates.extendSelection(cm.doc, pos);
            setTimeout(() => display.input.focus(), 20);
        } else if (button == 3) {
            if (browser.captureRightClick)
                cm.display.input.onContextMenu(e);
            else
                focus.delayBlurEvent(cm);
        }
    }
    function handleMappedButton(cm, button, pos, repeat, event) {
        let name = 'Click';
        if (repeat == 'double')
            name = 'Double' + name;
        else if (repeat == 'triple')
            name = 'Triple' + name;
        name = (button == 1 ? 'Left' : button == 2 ? 'Middle' : 'Right') + name;
        return q.dispatchKey(cm, p.addModifierNames(name, event), event, bound => {
            if (typeof bound == 'string')
                bound = r.commands[bound];
            if (!bound)
                return false;
            let done = false;
            try {
                if (cm.isReadOnly())
                    cm.state.suppressEdits = true;
                done = bound(cm, pos) != o.Pass;
            } finally {
                cm.state.suppressEdits = false;
            }
            return done;
        });
    }
    function configureMouse(cm, repeat, event) {
        let option = cm.getOption('configureMouse');
        let value = option ? option(cm, repeat, event) : {};
        if (value.unit == null) {
            let rect = browser.chromeOS ? event.shiftKey && event.metaKey : event.altKey;
            value.unit = rect ? 'rectangle' : repeat == 'single' ? 'char' : repeat == 'double' ? 'word' : 'line';
        }
        if (value.extend == null || cm.doc.extend)
            value.extend = cm.doc.extend || event.shiftKey;
        if (value.addNew == null)
            value.addNew = browser.mac ? event.metaKey : event.ctrlKey;
        if (value.moveOnDrag == null)
            value.moveOnDrag = !(browser.mac ? event.altKey : event.ctrlKey);
        return value;
    }
    function leftButtonDown(cm, pos, repeat, event) {
        if (browser.ie)
            setTimeout(o.bind(focus.ensureFocus, cm), 0);
        else
            cm.curOp.focus = dom.activeElt();
        let behavior = configureMouse(cm, repeat, event);
        let sel = cm.doc.sel, contained;
        if (cm.options.dragDrop && n.dragAndDrop && !cm.isReadOnly() && repeat == 'single' && (contained = sel.contains(pos)) > -1 && (line_pos.cmp((contained = sel.ranges[contained]).from(), pos) < 0 || pos.xRel > 0) && (line_pos.cmp(contained.to(), pos) > 0 || pos.xRel < 0))
            leftButtonStartDrag(cm, event, pos, behavior);
        else
            leftButtonSelect(cm, event, pos, behavior);
    }
    function leftButtonStartDrag(cm, event, pos, behavior) {
        let display = cm.display, moved = false;
        let dragEnd = operations.operation(cm, e => {
            if (browser.webkit)
                display.scroller.draggable = false;
            cm.state.draggingText = false;
            events.off(display.wrapper.ownerDocument, 'mouseup', dragEnd);
            events.off(display.wrapper.ownerDocument, 'mousemove', mouseMove);
            events.off(display.scroller, 'dragstart', dragStart);
            events.off(display.scroller, 'drop', dragEnd);
            if (!moved) {
                events.e_preventDefault(e);
                if (!behavior.addNew)
                    selection_updates.extendSelection(cm.doc, pos, null, null, behavior.extend);
                if (browser.webkit || browser.ie && browser.ie_version == 9)
                    setTimeout(() => {
                        display.wrapper.ownerDocument.body.focus();
                        display.input.focus();
                    }, 20);
                else
                    display.input.focus();
            }
        });
        let mouseMove = function (e2) {
            moved = moved || Math.abs(event.clientX - e2.clientX) + Math.abs(event.clientY - e2.clientY) >= 10;
        };
        let dragStart = () => moved = true;
        if (browser.webkit)
            display.scroller.draggable = true;
        cm.state.draggingText = dragEnd;
        dragEnd.copy = !behavior.moveOnDrag;
        if (display.scroller.dragDrop)
            display.scroller.dragDrop();
        events.on(display.wrapper.ownerDocument, 'mouseup', dragEnd);
        events.on(display.wrapper.ownerDocument, 'mousemove', mouseMove);
        events.on(display.scroller, 'dragstart', dragStart);
        events.on(display.scroller, 'drop', dragEnd);
        focus.delayBlurEvent(cm);
        setTimeout(() => display.input.focus(), 20);
    }
    function rangeForUnit(cm, pos, unit) {
        if (unit == 'char')
            return new selection.Range(pos, pos);
        if (unit == 'word')
            return cm.findWordAt(pos);
        if (unit == 'line')
            return new selection.Range(line_pos.Pos(pos.line, 0), line_pos.clipPos(cm.doc, line_pos.Pos(pos.line + 1, 0)));
        let result = unit(cm, pos);
        return new selection.Range(result.from, result.to);
    }
    function leftButtonSelect(cm, event, start, behavior) {
        let display = cm.display, doc = cm.doc;
        events.e_preventDefault(event);
        let ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
        if (behavior.addNew && !behavior.extend) {
            ourIndex = doc.sel.contains(start);
            if (ourIndex > -1)
                ourRange = ranges[ourIndex];
            else
                ourRange = new selection.Range(start, start);
        } else {
            ourRange = doc.sel.primary();
            ourIndex = doc.sel.primIndex;
        }
        if (behavior.unit == 'rectangle') {
            if (!behavior.addNew)
                ourRange = new selection.Range(start, start);
            start = position_measurement.posFromMouse(cm, event, true, true);
            ourIndex = -1;
        } else {
            let range = rangeForUnit(cm, start, behavior.unit);
            if (behavior.extend)
                ourRange = selection_updates.extendRange(ourRange, range.anchor, range.head, behavior.extend);
            else
                ourRange = range;
        }
        if (!behavior.addNew) {
            ourIndex = 0;
            selection_updates.setSelection(doc, new selection.Selection([ourRange], 0), o.sel_mouse);
            startSel = doc.sel;
        } else if (ourIndex == -1) {
            ourIndex = ranges.length;
            selection_updates.setSelection(doc, selection.normalizeSelection(cm, ranges.concat([ourRange]), ourIndex), {
                scroll: false,
                origin: '*mouse'
            });
        } else if (ranges.length > 1 && ranges[ourIndex].empty() && behavior.unit == 'char' && !behavior.extend) {
            selection_updates.setSelection(doc, selection.normalizeSelection(cm, ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0), {
                scroll: false,
                origin: '*mouse'
            });
            startSel = doc.sel;
        } else {
            selection_updates.replaceOneSelection(doc, ourIndex, ourRange, o.sel_mouse);
        }
        let lastPos = start;
        function extendTo(pos) {
            if (line_pos.cmp(lastPos, pos) == 0)
                return;
            lastPos = pos;
            if (behavior.unit == 'rectangle') {
                let ranges = [], tabSize = cm.options.tabSize;
                let startCol = o.countColumn(utils_line.getLine(doc, start.line).text, start.ch, tabSize);
                let posCol = o.countColumn(utils_line.getLine(doc, pos.line).text, pos.ch, tabSize);
                let left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
                for (let line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line)); line <= end; line++) {
                    let text = utils_line.getLine(doc, line).text, leftPos = o.findColumn(text, left, tabSize);
                    if (left == right)
                        ranges.push(new selection.Range(line_pos.Pos(line, leftPos), line_pos.Pos(line, leftPos)));
                    else if (text.length > leftPos)
                        ranges.push(new selection.Range(line_pos.Pos(line, leftPos), line_pos.Pos(line, o.findColumn(text, right, tabSize))));
                }
                if (!ranges.length)
                    ranges.push(new selection.Range(start, start));
                selection_updates.setSelection(doc, selection.normalizeSelection(cm, startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex), {
                    origin: '*mouse',
                    scroll: false
                });
                cm.scrollIntoView(pos);
            } else {
                let oldRange = ourRange;
                let range = rangeForUnit(cm, pos, behavior.unit);
                let anchor = oldRange.anchor, head;
                if (line_pos.cmp(range.anchor, anchor) > 0) {
                    head = range.head;
                    anchor = line_pos.minPos(oldRange.from(), range.anchor);
                } else {
                    head = range.anchor;
                    anchor = line_pos.maxPos(oldRange.to(), range.head);
                }
                let ranges = startSel.ranges.slice(0);
                ranges[ourIndex] = bidiSimplify(cm, new selection.Range(line_pos.clipPos(doc, anchor), head));
                selection_updates.setSelection(doc, selection.normalizeSelection(cm, ranges, ourIndex), o.sel_mouse);
            }
        }
        let editorSize = display.wrapper.getBoundingClientRect();
        let counter = 0;
        function extend(e) {
            let curCount = ++counter;
            let cur = position_measurement.posFromMouse(cm, e, true, behavior.unit == 'rectangle');
            if (!cur)
                return;
            if (line_pos.cmp(cur, lastPos) != 0) {
                cm.curOp.focus = dom.activeElt();
                extendTo(cur);
                let visible = update_lines.visibleLines(display, doc);
                if (cur.line >= visible.to || cur.line < visible.from)
                    setTimeout(operations.operation(cm, () => {
                        if (counter == curCount)
                            extend(e);
                    }), 150);
            } else {
                let outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
                if (outside)
                    setTimeout(operations.operation(cm, () => {
                        if (counter != curCount)
                            return;
                        display.scroller.scrollTop += outside;
                        extend(e);
                    }), 50);
            }
        }
        function done(e) {
            cm.state.selectingText = false;
            counter = Infinity;
            events.e_preventDefault(e);
            display.input.focus();
            events.off(display.wrapper.ownerDocument, 'mousemove', move);
            events.off(display.wrapper.ownerDocument, 'mouseup', up);
            doc.history.lastSelOrigin = null;
        }
        let move = operations.operation(cm, e => {
            if (e.buttons === 0 || !events.e_button(e))
                done(e);
            else
                extend(e);
        });
        let up = operations.operation(cm, done);
        cm.state.selectingText = up;
        events.on(display.wrapper.ownerDocument, 'mousemove', move);
        events.on(display.wrapper.ownerDocument, 'mouseup', up);
    }
    function bidiSimplify(cm, range) {
        let {anchor, head} = range, anchorLine = utils_line.getLine(cm.doc, anchor.line);
        if (line_pos.cmp(anchor, head) == 0 && anchor.sticky == head.sticky)
            return range;
        let order = bidi.getOrder(anchorLine);
        if (!order)
            return range;
        let index = bidi.getBidiPartAt(order, anchor.ch, anchor.sticky), part = order[index];
        if (part.from != anchor.ch && part.to != anchor.ch)
            return range;
        let boundary = index + (part.from == anchor.ch == (part.level != 1) ? 0 : 1);
        if (boundary == 0 || boundary == order.length)
            return range;
        let leftSide;
        if (head.line != anchor.line) {
            leftSide = (head.line - anchor.line) * (cm.doc.direction == 'ltr' ? 1 : -1) > 0;
        } else {
            let headIndex = bidi.getBidiPartAt(order, head.ch, head.sticky);
            let dir = headIndex - index || (head.ch - anchor.ch) * (part.level == 1 ? -1 : 1);
            if (headIndex == boundary - 1 || headIndex == boundary)
                leftSide = dir < 0;
            else
                leftSide = dir > 0;
        }
        let usePart = order[boundary + (leftSide ? -1 : 0)];
        let from = leftSide == (usePart.level == 1);
        let ch = from ? usePart.from : usePart.to, sticky = from ? 'after' : 'before';
        return anchor.ch == ch && anchor.sticky == sticky ? range : new selection.Range(new line_pos.Pos(anchor.line, ch, sticky), head);
    }
    function gutterEvent(cm, e, type, prevent) {
        let mX, mY;
        if (e.touches) {
            mX = e.touches[0].clientX;
            mY = e.touches[0].clientY;
        } else {
            try {
                mX = e.clientX;
                mY = e.clientY;
            } catch (e) {
                return false;
            }
        }
        if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right))
            return false;
        if (prevent)
            events.e_preventDefault(e);
        let display = cm.display;
        let lineBox = display.lineDiv.getBoundingClientRect();
        if (mY > lineBox.bottom || !events.hasHandler(cm, type))
            return events.e_defaultPrevented(e);
        mY -= lineBox.top - display.viewOffset;
        for (let i = 0; i < cm.options.gutters.length; ++i) {
            let g = display.gutters.childNodes[i];
            if (g && g.getBoundingClientRect().right >= mX) {
                let line = utils_line.lineAtHeight(cm.doc, mY);
                let gutter = cm.options.gutters[i];
                events.signal(cm, type, cm, line, gutter, e);
                return events.e_defaultPrevented(e);
            }
        }
    }
    function clickInGutter(cm, e) {
        return gutterEvent(cm, e, 'gutterClick', true);
    }
    function onContextMenu(cm, e) {
        if (widgets.eventInWidget(cm.display, e) || contextMenuInGutter(cm, e))
            return;
        if (events.signalDOMEvent(cm, e, 'contextmenu'))
            return;
        if (!browser.captureRightClick)
            cm.display.input.onContextMenu(e);
    }
    function contextMenuInGutter(cm, e) {
        if (!events.hasHandler(cm, 'gutterContextMenu'))
            return false;
        return gutterEvent(cm, e, 'gutterContextMenu', false);
    }
    return {
        onMouseDown: onMouseDown,
        clickInGutter: clickInGutter,
        onContextMenu: onContextMenu
    };
});
define('skylark-codemirror/primitives/edit/utils',['../measurement/position_measurement'], function (a) {
    'use strict';
    function themeChanged(cm) {
        cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, '') + cm.options.theme.replace(/(^|\s)\s*/g, ' cm-s-');
        a.clearCaches(cm);
    }
    return { themeChanged: themeChanged };
});
define('skylark-codemirror/primitives/edit/options',[
    '../display/focus',
    '../display/gutters',
    '../display/line_numbers',
    '../display/mode_state',
    '../display/scrollbars',
    '../display/selection',
    '../display/view_tracking',
    '../input/keymap',
    '../line/line_data',
    '../line/pos',
    '../line/spans',
    '../measurement/position_measurement',
    '../model/changes',
    '../util/browser',
    '../util/dom',
    '../util/event',
    './utils'
], function (focus, gutters, line_numbers, mode_state, scrollbars, selection, view_tracking, keymap, line_data, posit, spans, measurement, changes, browser, dom, event, utils) {
    'use strict';
    let Init = {
        toString: function () {
            return 'CodeMirror.Init';
        }
    };
    let defaults = {};
    let optionHandlers = {};
    function defineOptions(CodeMirror) {
        let optionHandlers = CodeMirror.optionHandlers;
        function option(name, deflt, handle, notOnInit) {
            CodeMirror.defaults[name] = deflt;
            if (handle)
                optionHandlers[name] = notOnInit ? (cm, val, old) => {
                    if (old != Init)
                        handle(cm, val, old);
                } : handle;
        }
        CodeMirror.defineOption = option;
        CodeMirror.Init = Init;
        option('value', '', (cm, val) => cm.setValue(val), true);
        option('mode', null, (cm, val) => {
            cm.doc.modeOption = val;
            mode_state.loadMode(cm);
        }, true);
        option('indentUnit', 2, mode_state.loadMode, true);
        option('indentWithTabs', false);
        option('smartIndent', true);
        option('tabSize', 4, cm => {
            mode_state.resetModeState(cm);
            measurement.clearCaches(cm);
            view_tracking.regChange(cm);
        }, true);
        option('lineSeparator', null, (cm, val) => {
            cm.doc.lineSep = val;
            if (!val)
                return;
            let newBreaks = [], lineNo = cm.doc.first;
            cm.doc.iter(line => {
                for (let pos = 0;;) {
                    let found = line.text.indexOf(val, pos);
                    if (found == -1)
                        break;
                    pos = found + val.length;
                    newBreaks.push(posit.Pos(lineNo, found));
                }
                lineNo++;
            });
            for (let i = newBreaks.length - 1; i >= 0; i--)
                changes.replaceRange(cm.doc, val, newBreaks[i], posit.Pos(newBreaks[i].line, newBreaks[i].ch + val.length));
        });
        option('specialChars', /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff]/g, (cm, val, old) => {
            cm.state.specialChars = new RegExp(val.source + (val.test('\t') ? '' : '|\t'), 'g');
            if (old != Init)
                cm.refresh();
        });
        option('specialCharPlaceholder', line_data.defaultSpecialCharPlaceholder, cm => cm.refresh(), true);
        option('electricChars', true);
        option('inputStyle', browser.mobile ? 'contenteditable' : 'textarea', () => {
            throw new Error('inputStyle can not (yet) be changed in a running editor');
        }, true);
        option('spellcheck', false, (cm, val) => cm.getInputField().spellcheck = val, true);
        option('autocorrect', false, (cm, val) => cm.getInputField().autocorrect = val, true);
        option('autocapitalize', false, (cm, val) => cm.getInputField().autocapitalize = val, true);
        option('rtlMoveVisually', !browser.windows);
        option('wholeLineUpdateBefore', true);
        option('theme', 'default', cm => {
            utils.themeChanged(cm);
            guttersChanged(cm);
        }, true);
        option('keyMap', 'default', (cm, val, old) => {
            let next = keymap.getKeyMap(val);
            let prev = old != Init && keymap.getKeyMap(old);
            if (prev && prev.detach)
                prev.detach(cm, next);
            if (next.attach)
                next.attach(cm, prev || null);
        });
        option('extraKeys', null);
        option('configureMouse', null);
        option('lineWrapping', false, wrappingChanged, true);
        option('gutters', [], cm => {
            gutters.setGuttersForLineNumbers(cm.options);
            guttersChanged(cm);
        }, true);
        option('fixedGutter', true, (cm, val) => {
            cm.display.gutters.style.left = val ? measurement.compensateForHScroll(cm.display) + 'px' : '0';
            cm.refresh();
        }, true);
        option('coverGutterNextToScrollbar', false, cm => scrollbars.updateScrollbars(cm), true);
        option('scrollbarStyle', 'native', cm => {
            scrollbars.initScrollbars(cm);
            scrollbars.updateScrollbars(cm);
            cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
            cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
        }, true);
        option('lineNumbers', false, cm => {
            gutters.setGuttersForLineNumbers(cm.options);
            guttersChanged(cm);
        }, true);
        option('firstLineNumber', 1, guttersChanged, true);
        option('lineNumberFormatter', integer => integer, guttersChanged, true);
        option('showCursorWhenSelecting', false, selection.updateSelection, true);
        option('resetSelectionOnContextMenu', true);
        option('lineWiseCopyCut', true);
        option('pasteLinesPerSelection', true);
        option('selectionsMayTouch', false);
        option('readOnly', false, (cm, val) => {
            if (val == 'nocursor') {
                focus.onBlur(cm);
                cm.display.input.blur();
            }
            cm.display.input.readOnlyChanged(val);
        });
        option('disableInput', false, (cm, val) => {
            if (!val)
                cm.display.input.reset();
        }, true);
        option('dragDrop', true, dragDropChanged);
        option('allowDropFileTypes', null);
        option('cursorBlinkRate', 530);
        option('cursorScrollMargin', 0);
        option('cursorHeight', 1, selection.updateSelection, true);
        option('singleCursorHeightPerLine', true, selection.updateSelection, true);
        option('workTime', 100);
        option('workDelay', 100);
        option('flattenSpans', true, mode_state.resetModeState, true);
        option('addModeClass', false, mode_state.resetModeState, true);
        option('pollInterval', 100);
        option('undoDepth', 200, (cm, val) => cm.doc.history.undoDepth = val);
        option('historyEventDelay', 1250);
        option('viewportMargin', 10, cm => cm.refresh(), true);
        option('maxHighlightLength', 10000, mode_state.resetModeState, true);
        option('moveInputWithCursor', true, (cm, val) => {
            if (!val)
                cm.display.input.resetPosition();
        });
        option('tabindex', null, (cm, val) => cm.display.input.getField().tabIndex = val || '');
        option('autofocus', null);
        option('direction', 'ltr', (cm, val) => cm.doc.setDirection(val), true);
        option('phrases', null);
    }
    function guttersChanged(cm) {
        gutters.updateGutters(cm);
        view_tracking.regChange(cm);
        line_numbers.alignHorizontally(cm);
    }
    function dragDropChanged(cm, value, old) {
        let wasOn = old && old != Init;
        if (!value != !wasOn) {
            let funcs = cm.display.dragFunctions;
            let toggle = value ? event.on : event.off;
            toggle(cm.display.scroller, 'dragstart', funcs.start);
            toggle(cm.display.scroller, 'dragenter', funcs.enter);
            toggle(cm.display.scroller, 'dragover', funcs.over);
            toggle(cm.display.scroller, 'dragleave', funcs.leave);
            toggle(cm.display.scroller, 'drop', funcs.drop);
        }
    }
    function wrappingChanged(cm) {
        if (cm.options.lineWrapping) {
            dom.addClass(cm.display.wrapper, 'CodeMirror-wrap');
            cm.display.sizer.style.minWidth = '';
            cm.display.sizerWidth = null;
        } else {
            dom.rmClass(cm.display.wrapper, 'CodeMirror-wrap');
            spans.findMaxLine(cm);
        }
        measurement.estimateLineHeights(cm);
        view_tracking.regChange(cm);
        measurement.clearCaches(cm);
        setTimeout(() => scrollbars.updateScrollbars(cm), 100);
    }
    return {
        Init: Init,
        defaults: defaults,
        optionHandlers: optionHandlers,
        defineOptions: defineOptions
    };
});
define('skylark-codemirror/primitives/edit/CodeMirror',[
    '../display/Display',
    '../display/focus',
    '../display/gutters',
    '../display/line_numbers',
    '../display/operations',
    '../display/scrollbars',
    '../display/scroll_events',
    '../display/scrolling',
    '../line/pos',
    '../measurement/position_measurement',
    '../measurement/widgets',
    '../model/Doc',
    '../model/document_data',
    '../model/selection',
    '../model/selection_updates',
    '../util/browser',
    '../util/event',
    '../util/misc',
    './drop_events',
    './global_events',
    './key_events',
    './mouse_events',
    './utils',
    './options'
], function (m_display, focuses, gutters, line_numbers, operations, scrollbars, scroll_events, scrolling, line_pos, position_measurement, widgets, Doc, document_data, selection, selection_updates, browser, events, misc, drop_events, global_events, key_events, mouse_events, utils, m_options) {
    'use strict';
    function CodeMirror(place, options) {
        if (!(this instanceof CodeMirror))
            return new CodeMirror(place, options);
        this.options = options = options ? misc.copyObj(options) : {};
        misc.copyObj(m_options.defaults, options, false);
        gutters.setGuttersForLineNumbers(options);
        let doc = options.value;
        if (typeof doc == 'string')
            doc = new Doc(doc, options.mode, null, options.lineSeparator, options.direction);
        else if (options.mode)
            doc.modeOption = options.mode;
        this.doc = doc;
        let input = new CodeMirror.inputStyles[options.inputStyle](this);
        let display = this.display = new m_display.Display(place, doc, input);
        display.wrapper.CodeMirror = this;
        gutters.updateGutters(this);
        utils.themeChanged(this);
        if (options.lineWrapping)
            this.display.wrapper.className += ' CodeMirror-wrap';
        scrollbars.initScrollbars(this);
        this.state = {
            keyMaps: [],
            overlays: [],
            modeGen: 0,
            overwrite: false,
            delayingBlurEvent: false,
            focused: false,
            suppressEdits: false,
            pasteIncoming: -1,
            cutIncoming: -1,
            selectingText: false,
            draggingText: false,
            highlight: new misc.Delayed(),
            keySeq: null,
            specialChars: null
        };
        if (options.autofocus && !browser.mobile)
            display.input.focus();
        if (browser.ie && browser.ie_version < 11)
            setTimeout(() => this.display.input.reset(true), 20);
        registerEventHandlers(this);
        global_events.ensureGlobalHandlers();
        operations.startOperation(this);
        this.curOp.forceUpdate = true;
        document_data.attachDoc(this, doc);
        if (options.autofocus && !browser.mobile || this.hasFocus())
            setTimeout(misc.bind(focuses.onFocus, this), 20);
        else
            focuses.onBlur(this);
        for (let opt in m_options.optionHandlers)
            if (m_options.optionHandlers.hasOwnProperty(opt))
                m_options.optionHandlers[opt](this, options[opt], m_options.Init);
        line_numbers.maybeUpdateLineNumberWidth(this);
        if (options.finishInit)
            options.finishInit(this);
        for (let i = 0; i < initHooks.length; ++i)
            initHooks[i](this);
        operations.endOperation(this);
        if (browser.webkit && options.lineWrapping && getComputedStyle(display.lineDiv).textRendering == 'optimizelegibility')
            display.lineDiv.style.textRendering = 'auto';
    }
    
    CodeMirror.defaults = m_options.defaults;
    CodeMirror.optionHandlers = m_options.optionHandlers;

    function registerEventHandlers(cm) {
        let d = cm.display;
        events.on(d.scroller, 'mousedown', operations.operation(cm, mouse_events.onMouseDown));
        if (browser.ie && browser.ie_version < 11)
            events.on(d.scroller, 'dblclick', operations.operation(cm, e => {
                if (events.signalDOMEvent(cm, e))
                    return;
                let pos = position_measurement.posFromMouse(cm, e);
                if (!pos || mouse_events.clickInGutter(cm, e) || widgets.eventInWidget(cm.display, e))
                    return;
                events.e_preventDefault(e);
                let word = cm.findWordAt(pos);
                selection_updates.extendSelection(cm.doc, word.anchor, word.head);
            }));
        else
            events.on(d.scroller, 'dblclick', e => events.signalDOMEvent(cm, e) || events.e_preventDefault(e));
        events.on(d.scroller, 'contextmenu', e => mouse_events.onContextMenu(cm, e));
        let touchFinished, prevTouch = { end: 0 };
        function finishTouch() {
            if (d.activeTouch) {
                touchFinished = setTimeout(() => d.activeTouch = null, 1000);
                prevTouch = d.activeTouch;
                prevTouch.end = +new Date();
            }
        }
        function isMouseLikeTouchEvent(e) {
            if (e.touches.length != 1)
                return false;
            let touch = e.touches[0];
            return touch.radiusX <= 1 && touch.radiusY <= 1;
        }
        function farAway(touch, other) {
            if (other.left == null)
                return true;
            let dx = other.left - touch.left, dy = other.top - touch.top;
            return dx * dx + dy * dy > 20 * 20;
        }
        events.on(d.scroller, 'touchstart', e => {
            if (!events.signalDOMEvent(cm, e) && !isMouseLikeTouchEvent(e) && !mouse_events.clickInGutter(cm, e)) {
                d.input.ensurePolled();
                clearTimeout(touchFinished);
                let now = +new Date();
                d.activeTouch = {
                    start: now,
                    moved: false,
                    prev: now - prevTouch.end <= 300 ? prevTouch : null
                };
                if (e.touches.length == 1) {
                    d.activeTouch.left = e.touches[0].pageX;
                    d.activeTouch.top = e.touches[0].pageY;
                }
            }
        });
        events.on(d.scroller, 'touchmove', () => {
            if (d.activeTouch)
                d.activeTouch.moved = true;
        });
        events.on(d.scroller, 'touchend', e => {
            let touch = d.activeTouch;
            if (touch && !widgets.eventInWidget(d, e) && touch.left != null && !touch.moved && new Date() - touch.start < 300) {
                let pos = cm.coordsChar(d.activeTouch, 'page'), range;
                if (!touch.prev || farAway(touch, touch.prev))
                    range = new selection.Range(pos, pos);
                else if (!touch.prev.prev || farAway(touch, touch.prev.prev))
                    range = cm.findWordAt(pos);
                else
                    range = new selection.Range(line_pos.Pos(pos.line, 0), line_pos.clipPos(cm.doc, line_pos.Pos(pos.line + 1, 0)));
                cm.setSelection(range.anchor, range.head);
                cm.focus();
                events.e_preventDefault(e);
            }
            finishTouch();
        });
        events.on(d.scroller, 'touchcancel', finishTouch);
        events.on(d.scroller, 'scroll', () => {
            if (d.scroller.clientHeight) {
                scrolling.updateScrollTop(cm, d.scroller.scrollTop);
                scrolling.setScrollLeft(cm, d.scroller.scrollLeft, true);
                events.signal(cm, 'scroll', cm);
            }
        });
        events.on(d.scroller, 'mousewheel', e => scroll_events.onScrollWheel(cm, e));
        events.on(d.scroller, 'DOMMouseScroll', e => scroll_events.onScrollWheel(cm, e));
        events.on(d.wrapper, 'scroll', () => d.wrapper.scrollTop = d.wrapper.scrollLeft = 0);
        d.dragFunctions = {
            enter: e => {
                if (!events.signalDOMEvent(cm, e))
                    events.e_stop(e);
            },
            over: e => {
                if (!events.signalDOMEvent(cm, e)) {
                    drop_events.onDragOver(cm, e);
                    events.e_stop(e);
                }
            },
            start: e => drop_events.onDragStart(cm, e),
            drop: operations.operation(cm, drop_events.onDrop),
            leave: e => {
                if (!events.signalDOMEvent(cm, e)) {
                    drop_events.clearDragCursor(cm);
                }
            }
        };
        let inp = d.input.getField();
        events.on(inp, 'keyup', e => key_events.onKeyUp.call(cm, e));
        events.on(inp, 'keydown', operations.operation(cm, key_events.onKeyDown));
        events.on(inp, 'keypress', operations.operation(cm, key_events.onKeyPress));
        events.on(inp, 'focus', e => focuses.onFocus(cm, e));
        events.on(inp, 'blur', e => focuses.onBlur(cm, e));
    }
    let initHooks = [];
    CodeMirror.defineInitHook = f => initHooks.push(f);

    return CodeMirror;
});
define('skylark-codemirror/primitives/input/indent',[
    '../line/highlight',
    '../line/pos',
    '../line/utils_line',
    '../model/changes',
    '../model/selection',
    '../model/selection_updates',
    '../util/misc'
], function (a, b, c, d, e, f, g) {
    'use strict';
    function indentLine(cm, n, how, aggressive) {
        let doc = cm.doc, state;
        if (how == null)
            how = 'add';
        if (how == 'smart') {
            if (!doc.mode.indent)
                how = 'prev';
            else
                state = a.getContextBefore(cm, n).state;
        }
        let tabSize = cm.options.tabSize;
        let line = c.getLine(doc, n), curSpace = g.countColumn(line.text, null, tabSize);
        if (line.stateAfter)
            line.stateAfter = null;
        let curSpaceString = line.text.match(/^\s*/)[0], indentation;
        if (!aggressive && !/\S/.test(line.text)) {
            indentation = 0;
            how = 'not';
        } else if (how == 'smart') {
            indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
            if (indentation == g.Pass || indentation > 150) {
                if (!aggressive)
                    return;
                how = 'prev';
            }
        }
        if (how == 'prev') {
            if (n > doc.first)
                indentation = g.countColumn(c.getLine(doc, n - 1).text, null, tabSize);
            else
                indentation = 0;
        } else if (how == 'add') {
            indentation = curSpace + cm.options.indentUnit;
        } else if (how == 'subtract') {
            indentation = curSpace - cm.options.indentUnit;
        } else if (typeof how == 'number') {
            indentation = curSpace + how;
        }
        indentation = Math.max(0, indentation);
        let indentString = '', pos = 0;
        if (cm.options.indentWithTabs)
            for (let i = Math.floor(indentation / tabSize); i; --i) {
                pos += tabSize;
                indentString += '\t';
            }
        if (pos < indentation)
            indentString += g.spaceStr(indentation - pos);
        if (indentString != curSpaceString) {
            d.replaceRange(doc, indentString, b.Pos(n, 0), b.Pos(n, curSpaceString.length), '+input');
            line.stateAfter = null;
            return true;
        } else {
            for (let i = 0; i < doc.sel.ranges.length; i++) {
                let range = doc.sel.ranges[i];
                if (range.head.line == n && range.head.ch < curSpaceString.length) {
                    let pos = b.Pos(n, curSpaceString.length);
                    f.replaceOneSelection(doc, i, new e.Range(pos, pos));
                    break;
                }
            }
        }
    }
    return { indentLine: indentLine };
});
define('skylark-codemirror/primitives/input/input',[
    '../display/operations',
    '../display/scrolling',
    '../line/pos',
    '../line/utils_line',
    '../model/changes',
    '../util/browser',
    '../util/dom',
    '../util/misc',
    '../util/operation_group',
    '../util/feature_detection',
    './indent'
], function (operations, scrolling, line_pos, utils_line, changes, browser, dom, misc, operation_group, feature_detection, indent) {
    'use strict';
    let lastCopied = null;
    function setLastCopied(newLastCopied) {
        lastCopied = newLastCopied;
    }
    function applyTextInput(cm, inserted, deleted, sel, origin) {
        let doc = cm.doc;
        cm.display.shift = false;
        if (!sel)
            sel = doc.sel;
        let recent = +new Date() - 200;
        let paste = origin == 'paste' || cm.state.pasteIncoming > recent;
        let textLines = feature_detection.splitLinesAuto(inserted), multiPaste = null;
        if (paste && sel.ranges.length > 1) {
            if (lastCopied && lastCopied.text.join('\n') == inserted) {
                if (sel.ranges.length % lastCopied.text.length == 0) {
                    multiPaste = [];
                    for (let i = 0; i < lastCopied.text.length; i++)
                        multiPaste.push(doc.splitLines(lastCopied.text[i]));
                }
            } else if (textLines.length == sel.ranges.length && cm.options.pasteLinesPerSelection) {
                multiPaste = misc.map(textLines, l => [l]);
            }
        }
        let updateInput = cm.curOp.updateInput;
        for (let i = sel.ranges.length - 1; i >= 0; i--) {
            let range = sel.ranges[i];
            let from = range.from(), to = range.to();
            if (range.empty()) {
                if (deleted && deleted > 0)
                    from = line_pos.Pos(from.line, from.ch - deleted);
                else if (cm.state.overwrite && !paste)
                    to = line_pos.Pos(to.line, Math.min(utils_line.getLine(doc, to.line).text.length, to.ch + misc.lst(textLines).length));
                else if (paste && lastCopied && lastCopied.lineWise && lastCopied.text.join('\n') == inserted)
                    from = to = line_pos.Pos(from.line, 0);
            }
            let changeEvent = {
                from: from,
                to: to,
                text: multiPaste ? multiPaste[i % multiPaste.length] : textLines,
                origin: origin || (paste ? 'paste' : cm.state.cutIncoming > recent ? 'cut' : '+input')
            };
            changes.makeChange(cm.doc, changeEvent);
            operation_group.signalLater(cm, 'inputRead', cm, changeEvent);
        }
        if (inserted && !paste)
            triggerElectric(cm, inserted);
        scrolling.ensureCursorVisible(cm);
        if (cm.curOp.updateInput < 2)
            cm.curOp.updateInput = updateInput;
        cm.curOp.typing = true;
        cm.state.pasteIncoming = cm.state.cutIncoming = -1;
    }
    function handlePaste(e, cm) {
        let pasted = e.clipboardData && e.clipboardData.getData('Text');
        if (pasted) {
            e.preventDefault();
            if (!cm.isReadOnly() && !cm.options.disableInput)
                operations.runInOp(cm, () => applyTextInput(cm, pasted, 0, null, 'paste'));
            return true;
        }
    }
    function triggerElectric(cm, inserted) {
        if (!cm.options.electricChars || !cm.options.smartIndent)
            return;
        let sel = cm.doc.sel;
        for (let i = sel.ranges.length - 1; i >= 0; i--) {
            let range = sel.ranges[i];
            if (range.head.ch > 100 || i && sel.ranges[i - 1].head.line == range.head.line)
                continue;
            let mode = cm.getModeAt(range.head);
            let indented = false;
            if (mode.electricChars) {
                for (let j = 0; j < mode.electricChars.length; j++)
                    if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
                        indented = indent.indentLine(cm, range.head.line, 'smart');
                        break;
                    }
            } else if (mode.electricInput) {
                if (mode.electricInput.test(utils_line.getLine(cm.doc, range.head.line).text.slice(0, range.head.ch)))
                    indented = indent.indentLine(cm, range.head.line, 'smart');
            }
            if (indented)
                operation_group.signalLater(cm, 'electricInput', cm, range.head.line);
        }
    }
    function copyableRanges(cm) {
        let text = [], ranges = [];
        for (let i = 0; i < cm.doc.sel.ranges.length; i++) {
            let line = cm.doc.sel.ranges[i].head.line;
            let lineRange = {
                anchor: line_pos.Pos(line, 0),
                head: line_pos.Pos(line + 1, 0)
            };
            ranges.push(lineRange);
            text.push(cm.getRange(lineRange.anchor, lineRange.head));
        }
        return {
            text: text,
            ranges: ranges
        };
    }
    function disableBrowserMagic(field, spellcheck, autocorrect, autocapitalize) {
        field.setAttribute('autocorrect', !!autocorrect);
        field.setAttribute('autocapitalize', !!autocapitalize);
        field.setAttribute('spellcheck', !!spellcheck);
    }
    function hiddenTextarea() {
        let te = dom.elt('textarea', null, null, 'position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none');
        let div = dom.elt('div', [te], null, 'overflow: hidden; position: relative; width: 3px; height: 0px;');
        if (browser.webkit)
            te.style.width = '1000px';
        else
            te.setAttribute('wrap', 'off');
        if (browser.ios)
            te.style.border = '1px solid black';
        disableBrowserMagic(te);
        return div;
    }
    return {
        lastCopied: lastCopied,
        setLastCopied: setLastCopied,
        applyTextInput: applyTextInput,
        handlePaste: handlePaste,
        triggerElectric: triggerElectric,
        copyableRanges: copyableRanges,
        disableBrowserMagic: disableBrowserMagic,
        hiddenTextarea: hiddenTextarea
    };
});
define('skylark-codemirror/primitives/edit/methods',[
    './deleteNearSelection',
    './commands',
    '../model/document_data',
    '../util/dom',
    '../util/event',
    '../line/highlight',
    '../input/indent',
    '../input/input',
    './key_events',
    './mouse_events',
    '../input/keymap',
    '../input/movement',
    '../display/operations',
    '../line/pos',
    '../measurement/position_measurement',
    '../model/selection',
    '../model/selection_updates',
    '../display/scrolling',
    '../line/spans',
    '../display/update_display',
    '../util/misc',
    '../util/operation_group',
    '../line/utils_line',
    '../display/view_tracking',
    '../display/highlight_worker',
    '../display/line_numbers',
    '../display/scrollbars'
], function (
    m_deleteNearSelection, 
    m_commands, 
    m_document_data, 
    dom, 
    events, 
    highlight, 
    indent, 
    m_input, 
    key_events, 
    mouse_events, 
    keymap, 
    movement, 
    operations, 
    line_pos, 
    position_measurement, 
    selection, 
    selection_updates, 
    scrolling, 
    line_spans, 
    update_display, 
    misc, 
    operation_group, 
    utils_line, 
    view_tracking,
    m_highlight_worker,
    m_line_numbers,
    m_scrollbars
) {
    'use strict';

    function findPosH(doc, pos, dir, unit, visually) {
        let oldPos = pos;
        let origDir = dir;
        let lineObj = utils_line.getLine(doc, pos.line);
        function findNextLine() {
            let l = pos.line + dir;
            if (l < doc.first || l >= doc.first + doc.size)
                return false;
            pos = new line_pos.Pos(l, pos.ch, pos.sticky);
            return lineObj = utils_line.getLine(doc, l);
        }
        function moveOnce(boundToLine) {
            let next;
            if (visually) {
                next = movement.moveVisually(doc.cm, lineObj, pos, dir);
            } else {
                next = movement.moveLogically(lineObj, pos, dir);
            }
            if (next == null) {
                if (!boundToLine && findNextLine())
                    pos = movement.endOfLine(visually, doc.cm, lineObj, pos.line, dir);
                else
                    return false;
            } else {
                pos = next;
            }
            return true;
        }
        if (unit == 'char') {
            moveOnce();
        } else if (unit == 'column') {
            moveOnce(true);
        } else if (unit == 'word' || unit == 'group') {
            let sawType = null, group = unit == 'group';
            let helper = doc.cm && doc.cm.getHelper(pos, 'wordChars');
            for (let first = true;; first = false) {
                if (dir < 0 && !moveOnce(!first))
                    break;
                let cur = lineObj.text.charAt(pos.ch) || '\n';
                let type = misc.isWordChar(cur, helper) ? 'w' : group && cur == '\n' ? 'n' : !group || /\s/.test(cur) ? null : 'p';
                if (group && !first && !type)
                    type = 's';
                if (sawType && sawType != type) {
                    if (dir < 0) {
                        dir = 1;
                        moveOnce();
                        pos.sticky = 'after';
                    }
                    break;
                }
                if (type)
                    sawType = type;
                if (dir > 0 && !moveOnce(!first))
                    break;
            }
        }
        let result = selection_updates.skipAtomic(doc, pos, oldPos, origDir, true);
        if (line_pos.equalCursorPos(oldPos, result))
            result.hitSide = true;
        return result;
    }
    function findPosV(cm, pos, dir, unit) {
        let doc = cm.doc, x = pos.left, y;
        if (unit == 'page') {
            let pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
            let moveAmount = Math.max(pageSize - 0.5 * position_measurement.textHeight(cm.display), 3);
            y = (dir > 0 ? pos.bottom : pos.top) + dir * moveAmount;
        } else if (unit == 'line') {
            y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
        }
        let target;
        for (;;) {
            target = position_measurement.coordsChar(cm, x, y);
            if (!target.outside)
                break;
            if (dir < 0 ? y <= 0 : y >= doc.height) {
                target.hitSide = true;
                break;
            }
            y += dir * 5;
        }
        return target;
    }
        
    return function (CodeMirror) {
        let optionHandlers = CodeMirror.optionHandlers;
        let helpers = CodeMirror.helpers = {};
        CodeMirror.prototype = {
            constructor: CodeMirror,
            focus: function () {
                window.focus();
                this.display.input.focus();
            },
            setOption: function (option, value) {
                let options = this.options, old = options[option];
                if (options[option] == value && option != 'mode')
                    return;
                options[option] = value;
                if (optionHandlers.hasOwnProperty(option))
                    operations.operation(this, optionHandlers[option])(this, value, old);
                events.signal(this, 'optionChange', this, option);
            },
            getOption: function (option) {
                return this.options[option];
            },
            getDoc: function () {
                return this.doc;
            },
            addKeyMap: function (map, bottom) {
                this.state.keyMaps[bottom ? 'push' : 'unshift'](keymap.getKeyMap(map));
            },
            removeKeyMap: function (map) {
                let maps = this.state.keyMaps;
                for (let i = 0; i < maps.length; ++i)
                    if (maps[i] == map || maps[i].name == map) {
                        maps.splice(i, 1);
                        return true;
                    }
            },
            addOverlay: operations.methodOp(function (spec, options) {
                let mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
                if (mode.startState)
                    throw new Error('Overlays may not be stateful.');
                misc.insertSorted(this.state.overlays, {
                    mode: mode,
                    modeSpec: spec,
                    opaque: options && options.opaque,
                    priority: options && options.priority || 0
                }, overlay => overlay.priority);
                this.state.modeGen++;
                view_tracking.regChange(this);
            }),
            removeOverlay: operations.methodOp(function (spec) {
                let overlays = this.state.overlays;
                for (let i = 0; i < overlays.length; ++i) {
                    let cur = overlays[i].modeSpec;
                    if (cur == spec || typeof spec == 'string' && cur.name == spec) {
                        overlays.splice(i, 1);
                        this.state.modeGen++;
                        view_tracking.regChange(this);
                        return;
                    }
                }
            }),
            indentLine: operations.methodOp(function (n, dir, aggressive) {
                if (typeof dir != 'string' && typeof dir != 'number') {
                    if (dir == null)
                        dir = this.options.smartIndent ? 'smart' : 'prev';
                    else
                        dir = dir ? 'add' : 'subtract';
                }
                if (utils_line.isLine(this.doc, n))
                    indent.indentLine(this, n, dir, aggressive);
            }),
            indentSelection: operations.methodOp(function (how) {
                let ranges = this.doc.sel.ranges, end = -1;
                for (let i = 0; i < ranges.length; i++) {
                    let range = ranges[i];
                    if (!range.empty()) {
                        let from = range.from(), to = range.to();
                        let start = Math.max(end, from.line);
                        end = Math.min(this.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
                        for (let j = start; j < end; ++j)
                            indent.indentLine(this, j, how);
                        let newRanges = this.doc.sel.ranges;
                        if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
                            selection_updates.replaceOneSelection(this.doc, i, new selection.Range(from, newRanges[i].to()), misc.sel_dontScroll);
                    } else if (range.head.line > end) {
                        indent.indentLine(this, range.head.line, how, true);
                        end = range.head.line;
                        if (i == this.doc.sel.primIndex)
                            scrolling.ensureCursorVisible(this);
                    }
                }
            }),
            getTokenAt: function (pos, precise) {
                return highlight.takeToken(this, pos, precise);
            },
            getLineTokens: function (line, precise) {
                return highlight.takeToken(this, line_pos.Pos(line), precise, true);
            },
            getTokenTypeAt: function (pos) {
                pos = line_pos.clipPos(this.doc, pos);
                let styles = highlight.getLineStyles(this, utils_line.getLine(this.doc, pos.line));
                let before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
                let type;
                if (ch == 0)
                    type = styles[2];
                else
                    for (;;) {
                        let mid = before + after >> 1;
                        if ((mid ? styles[mid * 2 - 1] : 0) >= ch)
                            after = mid;
                        else if (styles[mid * 2 + 1] < ch)
                            before = mid + 1;
                        else {
                            type = styles[mid * 2 + 2];
                            break;
                        }
                    }
                let cut = type ? type.indexOf('overlay ') : -1;
                return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1);
            },
            getModeAt: function (pos) {
                let mode = this.doc.mode;
                if (!mode.innerMode)
                    return mode;
                return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode;
            },
            getHelper: function (pos, type) {
                return this.getHelpers(pos, type)[0];
            },
            getHelpers: function (pos, type) {
                let found = [];
                if (!helpers.hasOwnProperty(type))
                    return found;
                let help = helpers[type], mode = this.getModeAt(pos);
                if (typeof mode[type] == 'string') {
                    if (help[mode[type]])
                        found.push(help[mode[type]]);
                } else if (mode[type]) {
                    for (let i = 0; i < mode[type].length; i++) {
                        let val = help[mode[type][i]];
                        if (val)
                            found.push(val);
                    }
                } else if (mode.helperType && help[mode.helperType]) {
                    found.push(help[mode.helperType]);
                } else if (help[mode.name]) {
                    found.push(help[mode.name]);
                }
                for (let i = 0; i < help._global.length; i++) {
                    let cur = help._global[i];
                    if (cur.pred(mode, this) && misc.indexOf(found, cur.val) == -1)
                        found.push(cur.val);
                }
                return found;
            },
            getStateAfter: function (line, precise) {
                let doc = this.doc;
                line = line_pos.clipLine(doc, line == null ? doc.first + doc.size - 1 : line);
                return highlight.getContextBefore(this, line + 1, precise).state;
            },
            cursorCoords: function (start, mode) {
                let pos, range = this.doc.sel.primary();
                if (start == null)
                    pos = range.head;
                else if (typeof start == 'object')
                    pos = line_pos.clipPos(this.doc, start);
                else
                    pos = start ? range.from() : range.to();
                return position_measurement.cursorCoords(this, pos, mode || 'page');
            },
            charCoords: function (pos, mode) {
                return position_measurement.charCoords(this, line_pos.clipPos(this.doc, pos), mode || 'page');
            },
            coordsChar: function (coords, mode) {
                coords = position_measurement.fromCoordSystem(this, coords, mode || 'page');
                return position_measurement.coordsChar(this, coords.left, coords.top);
            },
            lineAtHeight: function (height, mode) {
                height = position_measurement.fromCoordSystem(this, {
                    top: height,
                    left: 0
                }, mode || 'page').top;
                return utils_line.lineAtHeight(this.doc, height + this.display.viewOffset);
            },
            heightAtLine: function (line, mode, includeWidgets) {
                let end = false, lineObj;
                if (typeof line == 'number') {
                    let last = this.doc.first + this.doc.size - 1;
                    if (line < this.doc.first)
                        line = this.doc.first;
                    else if (line > last) {
                        line = last;
                        end = true;
                    }
                    lineObj = utils_line.getLine(this.doc, line);
                } else {
                    lineObj = line;
                }
                return position_measurement.intoCoordSystem(this, lineObj, {
                    top: 0,
                    left: 0
                }, mode || 'page', includeWidgets || end).top + (end ? this.doc.height - line_spans.heightAtLine(lineObj) : 0);
            },
            defaultTextHeight: function () {
                return position_measurement.textHeight(this.display);
            },
            defaultCharWidth: function () {
                return position_measurement.charWidth(this.display);
            },
            getViewport: function () {
                return {
                    from: this.display.viewFrom,
                    to: this.display.viewTo
                };
            },
            addWidget: function (pos, node, scroll, vert, horiz) {
                let display = this.display;
                pos = position_measurement.cursorCoords(this, line_pos.clipPos(this.doc, pos));
                let top = pos.bottom, left = pos.left;
                node.style.position = 'absolute';
                node.setAttribute('cm-ignore-events', 'true');
                this.display.input.setUneditable(node);
                display.sizer.appendChild(node);
                if (vert == 'over') {
                    top = pos.top;
                } else if (vert == 'above' || vert == 'near') {
                    let vspace = Math.max(display.wrapper.clientHeight, this.doc.height), hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
                    if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
                        top = pos.top - node.offsetHeight;
                    else if (pos.bottom + node.offsetHeight <= vspace)
                        top = pos.bottom;
                    if (left + node.offsetWidth > hspace)
                        left = hspace - node.offsetWidth;
                }
                node.style.top = top + 'px';
                node.style.left = node.style.right = '';
                if (horiz == 'right') {
                    left = display.sizer.clientWidth - node.offsetWidth;
                    node.style.right = '0px';
                } else {
                    if (horiz == 'left')
                        left = 0;
                    else if (horiz == 'middle')
                        left = (display.sizer.clientWidth - node.offsetWidth) / 2;
                    node.style.left = left + 'px';
                }
                if (scroll)
                    scrolling.scrollIntoView(this, {
                        left,
                        top,
                        right: left + node.offsetWidth,
                        bottom: top + node.offsetHeight
                    });
            },
            triggerOnKeyDown: operations.methodOp(key_events.onKeyDown),
            triggerOnKeyPress: operations.methodOp(key_events.onKeyPress),
            triggerOnKeyUp: key_events.onKeyUp,
            triggerOnMouseDown: operations.methodOp(mouse_events.onMouseDown),
            execCommand: function (cmd) {
                if (m_commands.commands.hasOwnProperty(cmd))
                    return m_commands.commands[cmd].call(null, this);
            },
            triggerElectric: operations.methodOp(function (text) {
                m_input.triggerElectric(this, text);
            }),
            findPosH: function (from, amount, unit, visually) {
                let dir = 1;
                if (amount < 0) {
                    dir = -1;
                    amount = -amount;
                }
                let cur = line_pos.clipPos(this.doc, from);
                for (let i = 0; i < amount; ++i) {
                    cur = findPosH(this.doc, cur, dir, unit, visually);
                    if (cur.hitSide)
                        break;
                }
                return cur;
            },
            moveH: operations.methodOp(function (dir, unit) {
                this.extendSelectionsBy(range => {
                    if (this.display.shift || this.doc.extend || range.empty())
                        return findPosH(this.doc, range.head, dir, unit, this.options.rtlMoveVisually);
                    else
                        return dir < 0 ? range.from() : range.to();
                }, misc.sel_move);
            }),
            deleteH: operations.methodOp(function (dir, unit) {
                let sel = this.doc.sel, doc = this.doc;
                if (sel.somethingSelected())
                    doc.replaceSelection('', null, '+delete');
                else
                    m_deleteNearSelection.deleteNearSelection(this, range => {
                        let other = findPosH(doc, range.head, dir, unit, false);
                        return dir < 0 ? {
                            from: other,
                            to: range.head
                        } : {
                            from: range.head,
                            to: other
                        };
                    });
            }),
            findPosV: function (from, amount, unit, goalColumn) {
                let dir = 1, x = goalColumn;
                if (amount < 0) {
                    dir = -1;
                    amount = -amount;
                }
                let cur = line_pos.clipPos(this.doc, from);
                for (let i = 0; i < amount; ++i) {
                    let coords = position_measurement.cursorCoords(this, cur, 'div');
                    if (x == null)
                        x = coords.left;
                    else
                        coords.left = x;
                    cur = findPosV(this, coords, dir, unit);
                    if (cur.hitSide)
                        break;
                }
                return cur;
            },
            moveV: operations.methodOp(function (dir, unit) {
                let doc = this.doc, goals = [];
                let collapse = !this.display.shift && !doc.extend && doc.sel.somethingSelected();
                doc.extendSelectionsBy(range => {
                    if (collapse)
                        return dir < 0 ? range.from() : range.to();
                    let headPos = position_measurement.cursorCoords(this, range.head, 'div');
                    if (range.goalColumn != null)
                        headPos.left = range.goalColumn;
                    goals.push(headPos.left);
                    let pos = findPosV(this, headPos, dir, unit);
                    if (unit == 'page' && range == doc.sel.primary())
                        scrolling.addToScrollTop(this, position_measurement.charCoords(this, pos, 'div').top - headPos.top);
                    return pos;
                }, misc.sel_move);
                if (goals.length)
                    for (let i = 0; i < doc.sel.ranges.length; i++)
                        doc.sel.ranges[i].goalColumn = goals[i];
            }),
            findWordAt: function (pos) {
                let doc = this.doc, line = utils_line.getLine(doc, pos.line).text;
                let start = pos.ch, end = pos.ch;
                if (line) {
                    let helper = this.getHelper(pos, 'wordChars');
                    if ((pos.sticky == 'before' || end == line.length) && start)
                        --start;
                    else
                        ++end;
                    let startChar = line.charAt(start);
                    let check = misc.isWordChar(startChar, helper) ? ch => misc.isWordChar(ch, helper) : /\s/.test(startChar) ? ch => /\s/.test(ch) : ch => !/\s/.test(ch) && !misc.isWordChar(ch);
                    while (start > 0 && check(line.charAt(start - 1)))
                        --start;
                    while (end < line.length && check(line.charAt(end)))
                        ++end;
                }
                return new selection.Range(line_pos.Pos(pos.line, start), line_pos.Pos(pos.line, end));
            },
            toggleOverwrite: function (value) {
                if (value != null && value == this.state.overwrite)
                    return;
                if (this.state.overwrite = !this.state.overwrite)
                    dom.addClass(this.display.cursorDiv, 'CodeMirror-overwrite');
                else
                    dom.rmClass(this.display.cursorDiv, 'CodeMirror-overwrite');
                events.signal(this, 'overwriteToggle', this, this.state.overwrite);
            },
            hasFocus: function () {
                return this.display.input.getField() == dom.activeElt();
            },
            isReadOnly: function () {
                return !!(this.options.readOnly || this.doc.cantEdit);
            },
            scrollTo: operations.methodOp(function (x, y) {
                scrolling.scrollToCoords(this, x, y);
            }),
            getScrollInfo: function () {
                let scroller = this.display.scroller;
                return {
                    left: scroller.scrollLeft,
                    top: scroller.scrollTop,
                    height: scroller.scrollHeight - position_measurement.scrollGap(this) - this.display.barHeight,
                    width: scroller.scrollWidth - position_measurement.scrollGap(this) - this.display.barWidth,
                    clientHeight: position_measurement.displayHeight(this),
                    clientWidth: position_measurement.displayWidth(this)
                };
            },
            scrollIntoView: operations.methodOp(function (range, margin) {
                if (range == null) {
                    range = {
                        from: this.doc.sel.primary().head,
                        to: null
                    };
                    if (margin == null)
                        margin = this.options.cursorScrollMargin;
                } else if (typeof range == 'number') {
                    range = {
                        from: line_pos.Pos(range, 0),
                        to: null
                    };
                } else if (range.from == null) {
                    range = {
                        from: range,
                        to: null
                    };
                }
                if (!range.to)
                    range.to = range.from;
                range.margin = margin || 0;
                if (range.from.line != null) {
                    scrolling.scrollToRange(this, range);
                } else {
                    scrolling.scrollToCoordsRange(this, range.from, range.to, range.margin);
                }
            }),
            setSize: operations.methodOp(function (width, height) {
                let interpret = val => typeof val == 'number' || /^\d+$/.test(String(val)) ? val + 'px' : val;
                if (width != null)
                    this.display.wrapper.style.width = interpret(width);
                if (height != null)
                    this.display.wrapper.style.height = interpret(height);
                if (this.options.lineWrapping)
                    position_measurement.clearLineMeasurementCache(this);
                let lineNo = this.display.viewFrom;
                this.doc.iter(lineNo, this.display.viewTo, line => {
                    if (line.widgets)
                        for (let i = 0; i < line.widgets.length; i++)
                            if (line.widgets[i].noHScroll) {
                                view_tracking.regLineChange(this, lineNo, 'widget');
                                break;
                            }
                    ++lineNo;
                });
                this.curOp.forceUpdate = true;
                events.signal(this, 'refresh', this);
            }),
            operation: function (f) {
                return operations.runInOp(this, f);
            },
            startOperation: function () {
                return operations.startOperation(this);
            },
            endOperation: function () {
                return operations.endOperation(this);
            },
            refresh: operations.methodOp(function () {
                let oldHeight = this.display.cachedTextHeight;
                view_tracking.regChange(this);
                this.curOp.forceUpdate = true;
                position_measurement.clearCaches(this);
                scrolling.scrollToCoords(this, this.doc.scrollLeft, this.doc.scrollTop);
                update_display.updateGutterSpace(this);
                if (oldHeight == null || Math.abs(oldHeight - position_measurement.textHeight(this.display)) > 0.5)
                    position_measurement.estimateLineHeights(this);
                events.signal(this, 'refresh', this);
            }),
            swapDoc: operations.methodOp(function (doc) {
                let old = this.doc;
                old.cm = null;
                m_document_data.attachDoc(this, doc);
                position_measurement.clearCaches(this);
                this.display.input.reset();
                scrolling.scrollToCoords(this, doc.scrollLeft, doc.scrollTop);
                this.curOp.forceScroll = true;
                operation_group.signalLater(this, 'swapDoc', this, old);
                return old;
            }),
            phrase: function (phraseText) {
                let phrases = this.options.phrases;
                return phrases && Object.prototype.hasOwnProperty.call(phrases, phraseText) ? phrases[phraseText] : phraseText;
            },
            getInputField: function () {
                return this.display.input.getField();
            },
            getWrapperElement: function () {
                return this.display.wrapper;
            },
            getScrollerElement: function () {
                return this.display.scroller;
            },
            getGutterElement: function () {
                return this.display.gutters;
            },

            startWorker : function(time) {
                return m_highlight_worker.startWorker(this,time);
            },

            maybeUpdateLineNumberWidth : function() {
                return m_line_numbers.maybeUpdateLineNumberWidth(this);
            },

            measureForScrollbars : function() {
                return m_scrollbars.measureForScrollbars(this);
            },

            updateScrollbars : function(measure) {
                return m_scrollbars.updateScrollbars(this,measure);
            }
        };
        events.eventMixin(CodeMirror);
        CodeMirror.registerHelper = function (type, name, value) {
            if (!helpers.hasOwnProperty(type))
                helpers[type] = CodeMirror[type] = { _global: [] };
            helpers[type][name] = value;
        };
        CodeMirror.registerGlobalHelper = function (type, name, predicate, value) {
            CodeMirror.registerHelper(type, name, value);
            helpers[type]._global.push({
                pred: predicate,
                val: value
            });
        };
    };

});
define('skylark-codemirror/primitives/input/ContentEditableInput',[
    '../display/operations',
    '../display/selection',
    '../display/view_tracking',
    './input',
    '../line/pos',
    '../line/utils_line',
    '../measurement/position_measurement',
    '../model/changes',
    '../model/selection',
    '../model/selection_updates',
    '../util/bidi',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/misc'
], function (operations, display_selection, view_tracking, inputs, line_pos, utils_line, position_measurement, changes, selection, selection_updates, bidi, browser, dom, events, misc) {
    'use strict';
    class ContentEditableInput {
        constructor(cm) {
            this.cm = cm;
            this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
            this.polling = new misc.Delayed();
            this.composing = null;
            this.gracePeriod = false;
            this.readDOMTimeout = null;
        }
        init(display) {
            let input = this, cm = input.cm;
            let div = input.div = display.lineDiv;
            inputs.disableBrowserMagic(div, cm.options.spellcheck, cm.options.autocorrect, cm.options.autocapitalize);
            events.on(div, 'paste', e => {
                if (events.signalDOMEvent(cm, e) || inputs.handlePaste(e, cm))
                    return;
                if (browser.ie_version <= 11)
                    setTimeout(operations.operation(cm, () => this.updateFromDOM()), 20);
            });
            events.on(div, 'compositionstart', e => {
                this.composing = {
                    data: e.data,
                    done: false
                };
            });
            events.on(div, 'compositionupdate', e => {
                if (!this.composing)
                    this.composing = {
                        data: e.data,
                        done: false
                    };
            });
            events.on(div, 'compositionend', e => {
                if (this.composing) {
                    if (e.data != this.composing.data)
                        this.readFromDOMSoon();
                    this.composing.done = true;
                }
            });
            events.on(div, 'touchstart', () => input.forceCompositionEnd());
            events.on(div, 'input', () => {
                if (!this.composing)
                    this.readFromDOMSoon();
            });
            function onCopyCut(e) {
                if (events.signalDOMEvent(cm, e))
                    return;
                if (cm.somethingSelected()) {
                    inputs.setLastCopied({
                        lineWise: false,
                        text: cm.getSelections()
                    });
                    if (e.type == 'cut')
                        cm.replaceSelection('', null, 'cut');
                } else if (!cm.options.lineWiseCopyCut) {
                    return;
                } else {
                    let ranges = inputs.copyableRanges(cm);
                    inputs.setLastCopied({
                        lineWise: true,
                        text: ranges.text
                    });
                    if (e.type == 'cut') {
                        cm.operation(() => {
                            cm.setSelections(ranges.ranges, 0, misc.sel_dontScroll);
                            cm.replaceSelection('', null, 'cut');
                        });
                    }
                }
                if (e.clipboardData) {
                    e.clipboardData.clearData();
                    let content = inputs.lastCopied.text.join('\n');
                    e.clipboardData.setData('Text', content);
                    if (e.clipboardData.getData('Text') == content) {
                        e.preventDefault();
                        return;
                    }
                }
                let kludge = inputs.hiddenTextarea(), te = kludge.firstChild;
                cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
                te.value = inputs.lastCopied.text.join('\n');
                let hadFocus = document.activeElement;
                dom.selectInput(te);
                setTimeout(() => {
                    cm.display.lineSpace.removeChild(kludge);
                    hadFocus.focus();
                    if (hadFocus == div)
                        input.showPrimarySelection();
                }, 50);
            }
            events.on(div, 'copy', onCopyCut);
            events.on(div, 'cut', onCopyCut);
        }
        prepareSelection() {
            let result = display_selection.prepareSelection(this.cm, false);
            result.focus = this.cm.state.focused;
            return result;
        }
        showSelection(info, takeFocus) {
            if (!info || !this.cm.display.view.length)
                return;
            if (info.focus || takeFocus)
                this.showPrimarySelection();
            this.showMultipleSelections(info);
        }
        getSelection() {
            return this.cm.display.wrapper.ownerDocument.getSelection();
        }
        showPrimarySelection() {
            let sel = this.getSelection(), cm = this.cm, prim = cm.doc.sel.primary();
            let from = prim.from(), to = prim.to();
            if (cm.display.viewTo == cm.display.viewFrom || from.line >= cm.display.viewTo || to.line < cm.display.viewFrom) {
                sel.removeAllRanges();
                return;
            }
            let curAnchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
            let curFocus = domToPos(cm, sel.focusNode, sel.focusOffset);
            if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad && line_pos.cmp(line_pos.minPos(curAnchor, curFocus), from) == 0 && line_pos.cmp(line_pos.maxPos(curAnchor, curFocus), to) == 0)
                return;
            let view = cm.display.view;
            let start = from.line >= cm.display.viewFrom && posToDOM(cm, from) || {
                node: view[0].measure.map[2],
                offset: 0
            };
            let end = to.line < cm.display.viewTo && posToDOM(cm, to);
            if (!end) {
                let measure = view[view.length - 1].measure;
                let map = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
                end = {
                    node: map[map.length - 1],
                    offset: map[map.length - 2] - map[map.length - 3]
                };
            }
            if (!start || !end) {
                sel.removeAllRanges();
                return;
            }
            let old = sel.rangeCount && sel.getRangeAt(0), rng;
            try {
                rng = dom.range(start.node, start.offset, end.offset, end.node);
            } catch (e) {
            }
            if (rng) {
                if (!browser.gecko && cm.state.focused) {
                    sel.collapse(start.node, start.offset);
                    if (!rng.collapsed) {
                        sel.removeAllRanges();
                        sel.addRange(rng);
                    }
                } else {
                    sel.removeAllRanges();
                    sel.addRange(rng);
                }
                if (old && sel.anchorNode == null)
                    sel.addRange(old);
                else if (browser.gecko)
                    this.startGracePeriod();
            }
            this.rememberSelection();
        }
        startGracePeriod() {
            clearTimeout(this.gracePeriod);
            this.gracePeriod = setTimeout(() => {
                this.gracePeriod = false;
                if (this.selectionChanged())
                    this.cm.operation(() => this.cm.curOp.selectionChanged = true);
            }, 20);
        }
        showMultipleSelections(info) {
            dom.removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
            dom.removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
        }
        rememberSelection() {
            let sel = this.getSelection();
            this.lastAnchorNode = sel.anchorNode;
            this.lastAnchorOffset = sel.anchorOffset;
            this.lastFocusNode = sel.focusNode;
            this.lastFocusOffset = sel.focusOffset;
        }
        selectionInEditor() {
            let sel = this.getSelection();
            if (!sel.rangeCount)
                return false;
            let node = sel.getRangeAt(0).commonAncestorContainer;
            return dom.contains(this.div, node);
        }
        focus() {
            if (this.cm.options.readOnly != 'nocursor') {
                if (!this.selectionInEditor())
                    this.showSelection(this.prepareSelection(), true);
                this.div.focus();
            }
        }
        blur() {
            this.div.blur();
        }
        getField() {
            return this.div;
        }
        supportsTouch() {
            return true;
        }
        receivedFocus() {
            let input = this;
            if (this.selectionInEditor())
                this.pollSelection();
            else
                operations.runInOp(this.cm, () => input.cm.curOp.selectionChanged = true);
            function poll() {
                if (input.cm.state.focused) {
                    input.pollSelection();
                    input.polling.set(input.cm.options.pollInterval, poll);
                }
            }
            this.polling.set(this.cm.options.pollInterval, poll);
        }
        selectionChanged() {
            let sel = this.getSelection();
            return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset || sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset;
        }
        pollSelection() {
            if (this.readDOMTimeout != null || this.gracePeriod || !this.selectionChanged())
                return;
            let sel = this.getSelection(), cm = this.cm;
            if (browser.android && browser.chrome && this.cm.options.gutters.length && isInGutter(sel.anchorNode)) {
                this.cm.triggerOnKeyDown({
                    type: 'keydown',
                    keyCode: 8,
                    preventDefault: Math.abs
                });
                this.blur();
                this.focus();
                return;
            }
            if (this.composing)
                return;
            this.rememberSelection();
            let anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
            let head = domToPos(cm, sel.focusNode, sel.focusOffset);
            if (anchor && head)
                operations.runInOp(cm, () => {
                    selection_updates.setSelection(cm.doc, selection.simpleSelection(anchor, head), misc.sel_dontScroll);
                    if (anchor.bad || head.bad)
                        cm.curOp.selectionChanged = true;
                });
        }
        pollContent() {
            if (this.readDOMTimeout != null) {
                clearTimeout(this.readDOMTimeout);
                this.readDOMTimeout = null;
            }
            let cm = this.cm, display = cm.display, sel = cm.doc.sel.primary();
            let from = sel.from(), to = sel.to();
            if (from.ch == 0 && from.line > cm.firstLine())
                from = line_pos.Pos(from.line - 1, utils_line.getLine(cm.doc, from.line - 1).length);
            if (to.ch == utils_line.getLine(cm.doc, to.line).text.length && to.line < cm.lastLine())
                to = line_pos.Pos(to.line + 1, 0);
            if (from.line < display.viewFrom || to.line > display.viewTo - 1)
                return false;
            let fromIndex, fromLine, fromNode;
            if (from.line == display.viewFrom || (fromIndex = position_measurement.findViewIndex(cm, from.line)) == 0) {
                fromLine = utils_line.lineNo(display.view[0].line);
                fromNode = display.view[0].node;
            } else {
                fromLine = utils_line.lineNo(display.view[fromIndex].line);
                fromNode = display.view[fromIndex - 1].node.nextSibling;
            }
            let toIndex = position_measurement.findViewIndex(cm, to.line);
            let toLine, toNode;
            if (toIndex == display.view.length - 1) {
                toLine = display.viewTo - 1;
                toNode = display.lineDiv.lastChild;
            } else {
                toLine = utils_line.lineNo(display.view[toIndex + 1].line) - 1;
                toNode = display.view[toIndex + 1].node.previousSibling;
            }
            if (!fromNode)
                return false;
            let newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
            let oldText = utils_line.getBetween(cm.doc, line_pos.Pos(fromLine, 0), line_pos.Pos(toLine, utils_line.getLine(cm.doc, toLine).text.length));
            while (newText.length > 1 && oldText.length > 1) {
                if (misc.lst(newText) == misc.lst(oldText)) {
                    newText.pop();
                    oldText.pop();
                    toLine--;
                } else if (newText[0] == oldText[0]) {
                    newText.shift();
                    oldText.shift();
                    fromLine++;
                } else
                    break;
            }
            let cutFront = 0, cutEnd = 0;
            let newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length);
            while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
                ++cutFront;
            let newBot = misc.lst(newText), oldBot = misc.lst(oldText);
            let maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0), oldBot.length - (oldText.length == 1 ? cutFront : 0));
            while (cutEnd < maxCutEnd && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
                ++cutEnd;
            if (newText.length == 1 && oldText.length == 1 && fromLine == from.line) {
                while (cutFront && cutFront > from.ch && newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1)) {
                    cutFront--;
                    cutEnd++;
                }
            }
            newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd).replace(/^\u200b+/, '');
            newText[0] = newText[0].slice(cutFront).replace(/\u200b+$/, '');
            let chFrom = line_pos.Pos(fromLine, cutFront);
            let chTo = line_pos.Pos(toLine, oldText.length ? misc.lst(oldText).length - cutEnd : 0);
            if (newText.length > 1 || newText[0] || line_pos.cmp(chFrom, chTo)) {
                changes.replaceRange(cm.doc, newText, chFrom, chTo, '+input');
                return true;
            }
        }
        ensurePolled() {
            this.forceCompositionEnd();
        }
        reset() {
            this.forceCompositionEnd();
        }
        forceCompositionEnd() {
            if (!this.composing)
                return;
            clearTimeout(this.readDOMTimeout);
            this.composing = null;
            this.updateFromDOM();
            this.div.blur();
            this.div.focus();
        }
        readFromDOMSoon() {
            if (this.readDOMTimeout != null)
                return;
            this.readDOMTimeout = setTimeout(() => {
                this.readDOMTimeout = null;
                if (this.composing) {
                    if (this.composing.done)
                        this.composing = null;
                    else
                        return;
                }
                this.updateFromDOM();
            }, 80);
        }
        updateFromDOM() {
            if (this.cm.isReadOnly() || !this.pollContent())
                operations.runInOp(this.cm, () => view_tracking.regChange(this.cm));
        }
        setUneditable(node) {
            node.contentEditable = 'false';
        }
        onKeyPress(e) {
            if (e.charCode == 0 || this.composing)
                return;
            e.preventDefault();
            if (!this.cm.isReadOnly())
                operations.operation(this.cm, inputs.applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0);
        }
        readOnlyChanged(val) {
            this.div.contentEditable = String(val != 'nocursor');
        }
        onContextMenu() {
        }
        resetPosition() {
        }
    };
    ContentEditableInput.prototype.needsContentAttribute = true;
    function posToDOM(cm, pos) {
        let view = position_measurement.findViewForLine(cm, pos.line);
        if (!view || view.hidden)
            return null;
        let line = utils_line.getLine(cm.doc, pos.line);
        let info = position_measurement.mapFromLineView(view, line, pos.line);
        let order = bidi.getOrder(line, cm.doc.direction), side = 'left';
        if (order) {
            let partPos = bidi.getBidiPartAt(order, pos.ch);
            side = partPos % 2 ? 'right' : 'left';
        }
        let result = position_measurement.nodeAndOffsetInLineMap(info.map, pos.ch, side);
        result.offset = result.collapse == 'right' ? result.end : result.start;
        return result;
    }
    function isInGutter(node) {
        for (let scan = node; scan; scan = scan.parentNode)
            if (/CodeMirror-gutter-wrapper/.test(scan.className))
                return true;
        return false;
    }
    function badPos(pos, bad) {
        if (bad)
            pos.bad = true;
        return pos;
    }
    function domTextBetween(cm, from, to, fromLine, toLine) {
        let text = '', closing = false, lineSep = cm.doc.lineSeparator(), extraLinebreak = false;
        function recognizeMarker(id) {
            return marker => marker.id == id;
        }
        function close() {
            if (closing) {
                text += lineSep;
                if (extraLinebreak)
                    text += lineSep;
                closing = extraLinebreak = false;
            }
        }
        function addText(str) {
            if (str) {
                close();
                text += str;
            }
        }
        function walk(node) {
            if (node.nodeType == 1) {
                let cmText = node.getAttribute('cm-text');
                if (cmText) {
                    addText(cmText);
                    return;
                }
                let markerID = node.getAttribute('cm-marker'), range;
                if (markerID) {
                    let found = cm.findMarks(line_pos.Pos(fromLine, 0), line_pos.Pos(toLine + 1, 0), recognizeMarker(+markerID));
                    if (found.length && (range = found[0].find(0)))
                        addText(utils_line.getBetween(cm.doc, range.from, range.to).join(lineSep));
                    return;
                }
                if (node.getAttribute('contenteditable') == 'false')
                    return;
                let isBlock = /^(pre|div|p|li|table|br)$/i.test(node.nodeName);
                if (!/^br$/i.test(node.nodeName) && node.textContent.length == 0)
                    return;
                if (isBlock)
                    close();
                for (let i = 0; i < node.childNodes.length; i++)
                    walk(node.childNodes[i]);
                if (/^(pre|p)$/i.test(node.nodeName))
                    extraLinebreak = true;
                if (isBlock)
                    closing = true;
            } else if (node.nodeType == 3) {
                addText(node.nodeValue.replace(/\u200b/g, '').replace(/\u00a0/g, ' '));
            }
        }
        for (;;) {
            walk(from);
            if (from == to)
                break;
            from = from.nextSibling;
            extraLinebreak = false;
        }
        return text;
    }
    function domToPos(cm, node, offset) {
        let lineNode;
        if (node == cm.display.lineDiv) {
            lineNode = cm.display.lineDiv.childNodes[offset];
            if (!lineNode)
                return badPos(cm.clipPos(line_pos.Pos(cm.display.viewTo - 1)), true);
            node = null;
            offset = 0;
        } else {
            for (lineNode = node;; lineNode = lineNode.parentNode) {
                if (!lineNode || lineNode == cm.display.lineDiv)
                    return null;
                if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv)
                    break;
            }
        }
        for (let i = 0; i < cm.display.view.length; i++) {
            let lineView = cm.display.view[i];
            if (lineView.node == lineNode)
                return locateNodeInLineView(lineView, node, offset);
        }
    }
    function locateNodeInLineView(lineView, node, offset) {
        let wrapper = lineView.text.firstChild, bad = false;
        if (!node || !dom.contains(wrapper, node))
            return badPos(line_pos.Pos(utils_line.lineNo(lineView.line), 0), true);
        if (node == wrapper) {
            bad = true;
            node = wrapper.childNodes[offset];
            offset = 0;
            if (!node) {
                let line = lineView.rest ? misc.lst(lineView.rest) : lineView.line;
                return badPos(line_pos.Pos(utils_line.lineNo(line), line.text.length), bad);
            }
        }
        let textNode = node.nodeType == 3 ? node : null, topNode = node;
        if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
            textNode = node.firstChild;
            if (offset)
                offset = textNode.nodeValue.length;
        }
        while (topNode.parentNode != wrapper)
            topNode = topNode.parentNode;
        let measure = lineView.measure, maps = measure.maps;
        function find(textNode, topNode, offset) {
            for (let i = -1; i < (maps ? maps.length : 0); i++) {
                let map = i < 0 ? measure.map : maps[i];
                for (let j = 0; j < map.length; j += 3) {
                    let curNode = map[j + 2];
                    if (curNode == textNode || curNode == topNode) {
                        let line = utils_line.lineNo(i < 0 ? lineView.line : lineView.rest[i]);
                        let ch = map[j] + offset;
                        if (offset < 0 || curNode != textNode)
                            ch = map[j + (offset ? 1 : 0)];
                        return line_pos.Pos(line, ch);
                    }
                }
            }
        }
        let found = find(textNode, topNode, offset);
        if (found)
            return badPos(found, bad);
        for (let after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
            found = find(after, after.firstChild, 0);
            if (found)
                return badPos(line_pos.Pos(found.line, found.ch - dist), bad);
            else
                dist += after.textContent.length;
        }
        for (let before = topNode.previousSibling, dist = offset; before; before = before.previousSibling) {
            found = find(before, before.firstChild, -1);
            if (found)
                return badPos(line_pos.Pos(found.line, found.ch + dist), bad);
            else
                dist += before.textContent.length;
        }
    }

    return ContentEditableInput;
});
define('skylark-codemirror/primitives/input/TextareaInput',[
    '../display/operations',
    '../display/selection',
    './input',
    '../measurement/position_measurement',
    '../measurement/widgets',
    '../model/selection',
    '../model/selection_updates',
    '../util/browser',
    '../util/dom',
    '../util/event',
    '../util/feature_detection',
    '../util/misc'
], function (
    operations, 
    display_selection, 
    inputs, 
    position_measurement, 
    widgets, 
    model_selection, 
    selection_updates, 
    browser, 
    dom, 
    event, 
    feature_detection, 
    misc
) {
    'use strict';
    class TextareaInput {
        constructor(cm) {
            this.cm = cm;
            this.prevInput = '';
            this.pollingFast = false;
            this.polling = new misc.Delayed();
            this.hasSelection = false;
            this.composing = null;
        }
        init(display) {
            let self = this, cm = this.cm;
            this.createField(display);
            const te = this.textarea;
            display.wrapper.insertBefore(this.wrapper, display.wrapper.firstChild);
            if (browser.ios)
                te.style.width = '0px';
            event.on(te, 'input', () => {
                if (browser.ie && browser.ie_version >= 9 && this.hasSelection)
                    this.hasSelection = null;
                self.poll();
            });
            event.on(te, 'paste', e => {
                if (event.signalDOMEvent(cm, e) || inputs.handlePaste(e, cm))
                    return;
                cm.state.pasteIncoming = +new Date();
                self.fastPoll();
            });
            function prepareCopyCut(e) {
                if (event.signalDOMEvent(cm, e))
                    return;
                if (cm.somethingSelected()) {
                    inputs.setLastCopied({
                        lineWise: false,
                        text: cm.getSelections()
                    });
                } else if (!cm.options.lineWiseCopyCut) {
                    return;
                } else {
                    let ranges = inputs.copyableRanges(cm);
                    inputs.setLastCopied({
                        lineWise: true,
                        text: ranges.text
                    });
                    if (e.type == 'cut') {
                        cm.setSelections(ranges.ranges, null, misc.sel_dontScroll);
                    } else {
                        self.prevInput = '';
                        te.value = ranges.text.join('\n');
                        dom.selectInput(te);
                    }
                }
                if (e.type == 'cut')
                    cm.state.cutIncoming = +new Date();
            }
            event.on(te, 'cut', prepareCopyCut);
            event.on(te, 'copy', prepareCopyCut);
            event.on(display.scroller, 'paste', e => {
                if (widgets.eventInWidget(display, e) || event.signalDOMEvent(cm, e))
                    return;
                if (!te.dispatchEvent) {
                    cm.state.pasteIncoming = +new Date();
                    self.focus();
                    return;
                }
                const event = new Event('paste');
                event.clipboardData = e.clipboardData;
                te.dispatchEvent(event);
            });
            event.on(display.lineSpace, 'selectstart', e => {
                if (!widgets.eventInWidget(display, e))
                    event.e_preventDefault(e);
            });
            event.on(te, 'compositionstart', () => {
                let start = cm.getCursor('from');
                if (self.composing)
                    self.composing.range.clear();
                self.composing = {
                    start: start,
                    range: cm.markText(start, cm.getCursor('to'), { className: 'CodeMirror-composing' })
                };
            });
            event.on(te, 'compositionend', () => {
                if (self.composing) {
                    self.poll();
                    self.composing.range.clear();
                    self.composing = null;
                }
            });
        }
        createField(_display) {
            this.wrapper = inputs.hiddenTextarea();
            this.textarea = this.wrapper.firstChild;
        }
        prepareSelection() {
            let cm = this.cm, display = cm.display, doc = cm.doc;
            let result = display_selection.prepareSelection(cm);
            if (cm.options.moveInputWithCursor) {
                let headPos = position_measurement.cursorCoords(cm, doc.sel.primary().head, 'div');
                let wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();
                result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10, headPos.top + lineOff.top - wrapOff.top));
                result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10, headPos.left + lineOff.left - wrapOff.left));
            }
            return result;
        }
        showSelection(drawn) {
            let cm = this.cm, display = cm.display;
            dom.removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
            dom.removeChildrenAndAdd(display.selectionDiv, drawn.selection);
            if (drawn.teTop != null) {
                this.wrapper.style.top = drawn.teTop + 'px';
                this.wrapper.style.left = drawn.teLeft + 'px';
            }
        }
        reset(typing) {
            if (this.contextMenuPending || this.composing)
                return;
            let cm = this.cm;
            if (cm.somethingSelected()) {
                this.prevInput = '';
                let content = cm.getSelection();
                this.textarea.value = content;
                if (cm.state.focused)
                    dom.selectInput(this.textarea);
                if (browser.ie && browser.ie_version >= 9)
                    this.hasSelection = content;
            } else if (!typing) {
                this.prevInput = this.textarea.value = '';
                if (browser.ie && browser.ie_version >= 9)
                    this.hasSelection = null;
            }
        }
        getField() {
            return this.textarea;
        }
        supportsTouch() {
            return false;
        }
        focus() {
            if (this.cm.options.readOnly != 'nocursor' && (!browser.mobile || dom.activeElt() != this.textarea)) {
                try {
                    this.textarea.focus();
                } catch (e) {
                }
            }
        }
        blur() {
            this.textarea.blur();
        }
        resetPosition() {
            this.wrapper.style.top = this.wrapper.style.left = 0;
        }
        receivedFocus() {
            this.slowPoll();
        }
        slowPoll() {
            if (this.pollingFast)
                return;
            this.polling.set(this.cm.options.pollInterval, () => {
                this.poll();
                if (this.cm.state.focused)
                    this.slowPoll();
            });
        }
        fastPoll() {
            let missed = false, self = this;
            self.pollingFast = true;
            function p() {
                let changed = self.poll();
                if (!changed && !missed) {
                    missed = true;
                    self.polling.set(60, p);
                } else {
                    self.pollingFast = false;
                    self.slowPoll();
                }
            }
            self.polling.set(20, p);
        }
        poll() {
            let cm = this.cm, input = this.textarea, prevInput = this.prevInput;
            if (this.contextMenuPending || !cm.state.focused || feature_detection.hasSelection(input) && !prevInput && !this.composing || cm.isReadOnly() || cm.options.disableInput || cm.state.keySeq)
                return false;
            let text = input.value;
            if (text == prevInput && !cm.somethingSelected())
                return false;
            if (browser.ie && browser.ie_version >= 9 && this.hasSelection === text || browser.mac && /[\uf700-\uf7ff]/.test(text)) {
                cm.display.input.reset();
                return false;
            }
            if (cm.doc.sel == cm.display.selForContextMenu) {
                let first = text.charCodeAt(0);
                if (first == 8203 && !prevInput)
                    prevInput = '\u200B';
                if (first == 8666) {
                    this.reset();
                    return this.cm.execCommand('undo');
                }
            }
            let same = 0, l = Math.min(prevInput.length, text.length);
            while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same))
                ++same;
            operations.runInOp(cm, () => {
                inputs.applyTextInput(cm, text.slice(same), prevInput.length - same, null, this.composing ? '*compose' : null);
                if (text.length > 1000 || text.indexOf('\n') > -1)
                    input.value = this.prevInput = '';
                else
                    this.prevInput = text;
                if (this.composing) {
                    this.composing.range.clear();
                    this.composing.range = cm.markText(this.composing.start, cm.getCursor('to'), { className: 'CodeMirror-composing' });
                }
            });
            return true;
        }
        ensurePolled() {
            if (this.pollingFast && this.poll())
                this.pollingFast = false;
        }
        onKeyPress() {
            if (browser.ie && browser.ie_version >= 9)
                this.hasSelection = null;
            this.fastPoll();
        }
        onContextMenu(e) {
            let self = this, cm = self.cm, display = cm.display, te = self.textarea;
            if (self.contextMenuPending)
                self.contextMenuPending();
            let pos = position_measurement.posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
            if (!pos || browser.presto)
                return;
            let reset = cm.options.resetSelectionOnContextMenu;
            if (reset && cm.doc.sel.contains(pos) == -1)
                operations.operation(cm, selection_updates.setSelection)(cm.doc, model_selection.simpleSelection(pos), misc.sel_dontScroll);
            let oldCSS = te.style.cssText, oldWrapperCSS = self.wrapper.style.cssText;
            let wrapperBox = self.wrapper.offsetParent.getBoundingClientRect();
            self.wrapper.style.cssText = 'position: static';
            te.style.cssText = `position: absolute; width: 30px; height: 30px;
      top: ${ e.clientY - wrapperBox.top - 5 }px; left: ${ e.clientX - wrapperBox.left - 5 }px;
      z-index: 1000; background: ${ browser.ie ? 'rgba(255, 255, 255, .05)' : 'transparent' };
      outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);`;
            let oldScrollY;
            if (browser.webkit)
                oldScrollY = window.scrollY;
            display.input.focus();
            if (browser.webkit)
                window.scrollTo(null, oldScrollY);
            display.input.reset();
            if (!cm.somethingSelected())
                te.value = self.prevInput = ' ';
            self.contextMenuPending = rehide;
            display.selForContextMenu = cm.doc.sel;
            clearTimeout(display.detectingSelectAll);
            function prepareSelectAllHack() {
                if (te.selectionStart != null) {
                    let selected = cm.somethingSelected();
                    let extval = '\u200B' + (selected ? te.value : '');
                    te.value = '\u21DA';
                    te.value = extval;
                    self.prevInput = selected ? '' : '\u200B';
                    te.selectionStart = 1;
                    te.selectionEnd = extval.length;
                    display.selForContextMenu = cm.doc.sel;
                }
            }
            function rehide() {
                if (self.contextMenuPending != rehide)
                    return;
                self.contextMenuPending = false;
                self.wrapper.style.cssText = oldWrapperCSS;
                te.style.cssText = oldCSS;
                if (browser.ie && browser.ie_version < 9)
                    display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos);
                if (te.selectionStart != null) {
                    if (!browser.ie || browser.ie && browser.ie_version < 9)
                        prepareSelectAllHack();
                    let i = 0, poll = () => {
                            if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 && te.selectionEnd > 0 && self.prevInput == '\u200B') {
                                operations.operation(cm, selection_updates.selectAll)(cm);
                            } else if (i++ < 10) {
                                display.detectingSelectAll = setTimeout(poll, 500);
                            } else {
                                display.selForContextMenu = null;
                                display.input.reset();
                            }
                        };
                    display.detectingSelectAll = setTimeout(poll, 200);
                }
            }
            if (browser.ie && browser.ie_version >= 9)
                prepareSelectAllHack();
            if (browser.captureRightClick) {
                event.e_stop(e);
                let mouseup = () => {
                    event.off(window, 'mouseup', mouseup);
                    setTimeout(rehide, 20);
                };
                event.on(window, 'mouseup', mouseup);
            } else {
                setTimeout(rehide, 50);
            }
        }
        readOnlyChanged(val) {
            if (!val)
                this.reset();
            this.textarea.disabled = val == 'nocursor';
        }
        setUneditable() {
        }
    };
    TextareaInput.prototype.needsContentAttribute = false;

    return TextareaInput;

});
define('skylark-codemirror/primitives/edit/fromTextArea',[
    './CodeMirror',
    '../util/dom',
    '../util/event',
    '../util/misc'
], function (CodeMirror, dom, events, misc) {
    'use strict';
    function fromTextArea(textarea, options) {
        options = options ? misc.copyObj(options) : {};
        options.value = textarea.value;
        if (!options.tabindex && textarea.tabIndex)
            options.tabindex = textarea.tabIndex;
        if (!options.placeholder && textarea.placeholder)
            options.placeholder = textarea.placeholder;
        if (options.autofocus == null) {
            let hasFocus = dom.activeElt();
            options.autofocus = hasFocus == textarea || textarea.getAttribute('autofocus') != null && hasFocus == document.body;
        }
        function save() {
            textarea.value = cm.getValue();
        }
        let realSubmit;
        if (textarea.form) {
            events.on(textarea.form, 'submit', save);
            if (!options.leaveSubmitMethodAlone) {
                let form = textarea.form;
                realSubmit = form.submit;
                try {
                    let wrappedSubmit = form.submit = () => {
                        save();
                        form.submit = realSubmit;
                        form.submit();
                        form.submit = wrappedSubmit;
                    };
                } catch (e) {
                }
            }
        }
        options.finishInit = cm => {
            cm.save = save;
            cm.getTextArea = () => textarea;
            cm.toTextArea = () => {
                cm.toTextArea = isNaN;
                save();
                textarea.parentNode.removeChild(cm.getWrapperElement());
                textarea.style.display = '';
                if (textarea.form) {
                    events.off(textarea.form, 'submit', save);
                    if (typeof textarea.form.submit == 'function')
                        textarea.form.submit = realSubmit;
                }
            };
        };
        textarea.style.display = 'none';
        let cm = CodeMirror(node => textarea.parentNode.insertBefore(node, textarea.nextSibling), options);
        return cm;
    }
    return { fromTextArea: fromTextArea };
});
define('skylark-codemirror/primitives/edit/legacy',[
    '../display/scrollbars',
    '../display/scroll_events',
    '../input/keymap',
    '../input/keynames',
    '../line/line_data',
    '../line/pos',
    '../model/change_measurement',
    '../model/Doc',
    '../model/line_widget',
    '../model/mark_text',
    '../modes',
    '../util/dom',
    '../util/event',
    '../util/feature_detection',
    '../util/misc',
    '../util/StringStream',
    './commands'
], function (a, b, c, d, e, f, g, Doc, h, i, j, k, l, m, n, StringStream, o) {
    'use strict';
    function addLegacyProps(CodeMirror) {
        CodeMirror.off = l.off;
        CodeMirror.on = l.on;
        CodeMirror.wheelEventPixels = b.wheelEventPixels;
        CodeMirror.Doc = Doc;
        CodeMirror.splitLines = m.splitLinesAuto;
        CodeMirror.countColumn = n.countColumn;
        CodeMirror.findColumn = n.findColumn;
        CodeMirror.isWordChar = n.isWordCharBasic;
        CodeMirror.Pass = n.Pass;
        CodeMirror.signal = l.signal;
        CodeMirror.Line = e.Line;
        CodeMirror.changeEnd = g.changeEnd;
        CodeMirror.scrollbarModel = a.scrollbarModel;
        CodeMirror.Pos = f.Pos;
        CodeMirror.cmpPos = f.cmp;
        CodeMirror.modes = j.modes;
        CodeMirror.mimeModes = j.mimeModes;
        CodeMirror.resolveMode = j.resolveMode;
        CodeMirror.getMode = j.getMode;
        CodeMirror.modeExtensions = j.modeExtensions;
        CodeMirror.extendMode = j.extendMode;
        CodeMirror.copyState = j.copyState;
        CodeMirror.startState = j.startState;
        CodeMirror.innerMode = j.innerMode;
        CodeMirror.commands = o.commands;
        CodeMirror.keyMap = c.keyMap;
        CodeMirror.keyName = c.keyName;
        CodeMirror.isModifierKey = c.isModifierKey;
        CodeMirror.lookupKey = c.lookupKey;
        CodeMirror.normalizeKeyMap = c.normalizeKeyMap;
        CodeMirror.StringStream = StringStream;
        CodeMirror.SharedTextMarker = i.SharedTextMarker;
        CodeMirror.TextMarker = i.TextMarker;
        CodeMirror.LineWidget = h.LineWidget;
        CodeMirror.e_preventDefault = l.e_preventDefault;
        CodeMirror.e_stopPropagation = l.e_stopPropagation;
        CodeMirror.e_stop = l.e_stop;
        CodeMirror.addClass = k.addClass;
        CodeMirror.contains = k.contains;
        CodeMirror.rmClass = k.rmClass;
        CodeMirror.keyNames = d.keyNames;
    }
    return { addLegacyProps: addLegacyProps };
});
define('skylark-codemirror/primitives/edit/main',[
    './CodeMirror',
    '../util/event',
    '../util/misc',
    './options',
    './methods',
    '../model/Doc',
    '../input/ContentEditableInput',
    '../input/TextareaInput',
    '../modes',
    './fromTextArea',
    './legacy'
], function (CodeMirror, events, misc, options, addEditorMethods, Doc, ContentEditableInput, TextareaInput, modes, m_fromTextArea, legacy) {
    'use strict';
    options.defineOptions(CodeMirror);

    addEditorMethods(CodeMirror);

    let dontDelegate = 'iter insert remove copy getEditor constructor'.split(' ');
    for (let prop in Doc.prototype)
        if (Doc.prototype.hasOwnProperty(prop) && misc.indexOf(dontDelegate, prop) < 0)
            CodeMirror.prototype[prop] = function (method) {
                return function () {
                    return method.apply(this.doc, arguments);
                };
            }(Doc.prototype[prop]);

    events.eventMixin(Doc);

    CodeMirror.inputStyles = {
        'textarea': TextareaInput,
        'contenteditable': ContentEditableInput
    };

    CodeMirror.defineMode = function (name) {
        if (!CodeMirror.defaults.mode && name != 'null')
            CodeMirror.defaults.mode = name;
        modes.defineMode.apply(this, arguments);
    };

    CodeMirror.defineMIME = modes.defineMIME;

    CodeMirror.defineMode('null', () => ({ token: stream => stream.skipToEnd() }));

    CodeMirror.defineMIME('text/plain', 'null');

    CodeMirror.defineExtension = (name, func) => {
        CodeMirror.prototype[name] = func;
    };

    CodeMirror.defineDocExtension = (name, func) => {
        Doc.prototype[name] = func;
    };

    CodeMirror.fromTextArea = m_fromTextArea.fromTextArea;

    legacy.addLegacyProps(CodeMirror);
    CodeMirror.version = '5.45.0';
    return { 
        CodeMirror : CodeMirror 
    };
});
define('skylark-codemirror/CodeMirror',[
	'./cm',
	'./primitives/edit/main'
], function (cm,_main) {
    'use strict';
    return cm.CodeMirror = _main.CodeMirror;
});
define('skylark-minibed/utils',[],function(){

  /* GLOBAL XMLHttpRequest, XDomainRequest */
  const animationEndEvents = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'

  function CreateDOM (tagName) {
    let parts = tagName.split('.')
    tagName = parts.shift()

    this.el = document.createElement(tagName)

    parts.forEach(c => {
      addClass(this.el, c)
    })

    this.class = name => {
      addClass(this.el, name)
      return this
    }

    this.setAttr = (attr, val) => {
      this.el.setAttribute(attr, val)
      return this
    }

    this.html = val => {
      this.el.innerHTML = val
      return this
    }

    this.dom = () => {
      return this.el
    }

    this.append = el => {
      this.el.appendChild(el)
      return this
    }

    return this
  }

  function inArray (needle, haystack, argStrict) {
    let key
    let strict = !!argStrict

    if (strict) {
      for (key in haystack) {
        if (haystack.hasOwnProperty(key) && haystack[key] === needle) {
          return true
        }
      }
    } else {
      for (key in haystack) {
        if (haystack.hasOwnProperty(key) && haystack[key] === needle) {
          return true
        }
      }
    }
    return false
  }

  function stopPropagation (evt) {
    evt = evt || window.event

    if (typeof evt.stopPropagation !== 'undefined') {
      evt.stopPropagation()
    } else {
      evt.cancelBubble = true
    }
  }

  const deepExtend = function (out) {
    out = out || {}

    for (let i = 1; i < arguments.length; i++) {
      let obj = arguments[i]

      if (!obj) continue

      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (Array.isArray(obj[key])) {
            out[key] = obj[key]
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            out[key] = deepExtend(out[key], obj[key])
          } else {
            out[key] = obj[key]
          }
        }
      }
    }

    return out
  }

  function generateID (prefix = '') {
    let id = `minibed_${prefix}_`

    id += 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0
      let v = c === 'x' ? r : r & 0x3 | 0x8
      return v.toString(16)
    })

    return id
  }

  function outerHeight (el) {
    let height = el.offsetHeight
    let style = window.getComputedStyle(el)

    height += parseInt(style.marginTop) + parseInt(style.marginBottom)
    return height
  }

  let css = (function () {
    let cssPrefixes = ['Webkit', 'O', 'Moz', 'ms']
    let cssProps = {}

    function camelCase (string) {
      return string
        .replace(/^-ms-/, 'ms-')
        .replace(/-([\da-z])/gi, function (match, letter) {
          return letter.toUpperCase()
        })
    }

    function getVendorProp (name) {
      let style = document.body.style
      if (name in style) return name

      let i = cssPrefixes.length
      let capName = name.charAt(0).toUpperCase() + name.slice(1)
      let vendorName

      while (i--) {
        vendorName = cssPrefixes[i] + capName
        if (vendorName in style) return vendorName
      }

      return name
    }

    function getStyleProp (name) {
      name = camelCase(name)
      return cssProps[name] || (cssProps[name] = getVendorProp(name))
    }

    function applyCss (element, prop, value) {
      prop = getStyleProp(prop)
      element.style[prop] = value
    }

    return function (element, properties) {
      let args = arguments
      let prop
      let value

      if (args.length === 2) {
        for (prop in properties) {
          if (properties.hasOwnProperty(prop)) {
            value = properties[prop]
            if (value !== undefined && properties.hasOwnProperty(prop)) {
              applyCss(element, prop, value)
            }
          }
        }
      } else {
        applyCss(element, args[1], args[2])
      }
    }
  })()

  function addListener (el, events, cb, useCapture = false) {
    events = events.split(' ')
    for (let i = 0; i < events.length; i++) {
      if (document.addEventListener) {
        el.addEventListener(events[i], cb, useCapture)
      } else if (document.attachEvent) {
        el.attachEvent('on' + events[i], cb)
      }
    }
  }

  function hasClass (element, name) {
    let list = typeof element === 'string' ? element : classList(element)
    return list.indexOf(' ' + name + ' ') >= 0
  }

  function addClass (element, name) {
    let oldList = classList(element)
    let newList = oldList + name

    if (hasClass(oldList, name)) return

    // Trim the opening space.
    element.className = newList.substring(1)
  }

  function removeClass (element, name) {
    let oldList = classList(element)
    let newList

    if (!hasClass(element, name)) return

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ')

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1)
  }

  function remove (element) {
    if (element.parentNode) {
      element.parentNode.removeChild(element)
    }
  }

  function classList (element) {
    return (' ' + ((element && element.className) || '') + ' ').replace(
      /\s+/gi,
      ' '
    )
  }

  function getExtension (fileName) {
    return fileName.match(/\.([^.]+)$/)[1]
  }

  function fixHTML (html) {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.innerHTML
  }

  const Request = (url, callback, failCallback) => {
    const xmlHttp = new window.XMLHttpRequest()

    // @see http://blogs.msdn.com/b/ie/archive/2012/02/09/cors-for-xhr-in-ie10.aspx
    // @see http://bionicspirit.com/blog/2011/03/24/cross-domain-requests.html
    // @see http://msdn.microsoft.com/en-us/library/ie/cc288060(v=vs.85).aspx
    if ('withCredentials' in xmlHttp) {
      // for Chrome, Firefox, Opera
      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState === 4) {
          if (xmlHttp.status === 200 || xmlHttp.status === 304) {
            callback(xmlHttp.responseText)
          } else {
            setTimeout(failCallback, 0)
          }
        }
      }

      xmlHttp.open('GET', url, true)
      xmlHttp.send()
    } else {
      // for IE
      const xdr = new window.XDomainRequest()
      xdr.onerror = () => {
        setTimeout(failCallback, 0)
      }
      xdr.ontimeout = () => {
        setTimeout(failCallback, 0)
      }
      xdr.onload = () => {
        callback(xdr.responseText)
      }

      xdr.open('get', url)
      xdr.send()
    }
  }

  function isTouchDevice () {
    return 'ontouchstart' in window || navigator.maxTouchPoints
  }

  function MBResizable (el, cb = () => {}) {
    const self = this
    this.el = el

    const handle = new CreateDOM('div.resizable-handle').el
    el.appendChild(handle)

    addListener(handle, 'mousedown', initResizeable, false)
    addListener(handle, 'touchstart', initResizeable, false)

    function initResizeable (e) {
      e.preventDefault()

      try {
        e = e.touches[0] ? e.touches[0] : e
      } catch (err) {}

      self.startX = e.clientX
      self.startY = e.clientY
      self.startWidth = parseInt(
        document.defaultView.getComputedStyle(self.el, null).width,
        10
      )
      self.startHeight = parseInt(
        document.defaultView.getComputedStyle(self.el, null).height,
        10
      )

      addListener(window, 'mousemove', onDrag, false)
      addListener(window, 'mouseup', stopDrag, false)

      addListener(window, 'touchmove', onTouchMove, false)
      addListener(window, 'touchend', onTouchEnd, false)
    }

    function onTouchMove (e) {
      onDrag(e.touches[0])
    }

    function onTouchEnd (e) {
      if (e.touches.length === 0) {
        stopDrag(e.changedTouches[0])
      }
    }

    function onDrag (e) {
      self.el.style.height = self.startHeight + e.clientY - self.startY + 'px'
      cb()
    }

    function stopDrag () {
      window.removeEventListener('mousemove', onDrag, false)
      window.removeEventListener('mouseup', stopDrag, false)
      window.removeEventListener('touchmove', onTouchMove, false)
      window.removeEventListener('touchend', onTouchEnd, false)
    }
  }

  return {
    animationEndEvents,
    CreateDOM,
    inArray,
    stopPropagation,
    deepExtend,
    generateID,
    outerHeight,
    css,
    addListener,
    hasClass,
    addClass,
    removeClass,
    remove,
    classList,
    getExtension,
    fixHTML,
    Request,
    isTouchDevice,
    MBResizable
  }

});
define('skylark-minibed/api',[
  "./utils"
],function(Utils){

  const FileTypes = {
    html: ['html'],
    css: ['css', 'sass', 'scss', 'less'],
    js: ['js', 'es6']
  }

  const Includes = {
    normalize: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/6.0.0/normalize.min.css',
    reset: 'https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css'
  }

  let Defaults = {
    theme: 'dark',
    editorTheme: 'minibed-dark',
    id: false,
    container: false,
    files: {
      html: [],
      js: [],
      css: []
    },
    external: {
      js: [],
      css: []
    },
    settings: {
      readOnly: false, // true, nocursor, false
      scrollLock: false,
      lineWrapping: true,
      lineNumbers: true,
      tabSize: 2,
      js: {
        preprocessor: 'none' // babel, typescript, coffeescript, livescript
      },
      css: {
        preprocessor: 'none', // less, sass, scss, stylus, postcss
        base: 'normalize', // reset, none
        prefixing: 'none', // autoprefixer
        imports: [] // susy, compass, bourbon etc. NOT IMPLEMENTED YET
      },
      html: {
        preprocessor: 'none' // haml, markdown, slim, pug
      }
    }
  }

  const PreprocessorNames = {
    sass: 'SASS',
    scss: 'SCSS',
    less: 'LESS',
    stylus: 'Stylus',
    babel: 'Babel',
    coffeescript: 'CoffeeScript',
    livescript: 'LiveScript',
    typescript: 'TypeScript',
    haml: 'Haml',
    slim: 'Slim',
    pug: 'Pug'
  }
  /**
   * @param {Minibed} ref
   * @return {void}
   */
  function build (ref) {
    findOrCreateContainer(ref)

    ref.wrapper = document.createElement('div')
    ref.wrapper.setAttribute('id', ref.id)
    Utils.addClass(
      ref.wrapper,
      `minibed_bed minibed_theme__${ref.options.theme}`
    )

    if (ref.options.notes.length > 0) {
      Utils.addClass(ref.wrapper, 'minibed_has_footer')
    }

    buildHeader(ref)
    buildContents(ref)
    buildFooter(ref)
  }

  function getProcessorNameFor (ref, lang) {
    let name = PreprocessorNames[ref.options.settings[lang].preprocessor]
    if (name === undefined) {
      if (lang === 'js') {
        return 'JavaScript'
      } else if (lang === 'css') {
        return 'CSS'
      } else {
        return 'HTML'
      }
    }

    return name
  }

  /**
   * @param {Minibed} ref
   * @return {void}
   */
  function buildHeader (ref) {
    const tabs = new Utils.CreateDOM('div.minibed_tabs')
    let foundActive = false

    const logo = new Utils.CreateDOM('a.minibed_logo')
      .setAttr('href', 'http://ned.im/minibed')
      .html('minibed')
    tabs.append(logo.el)

    if (ref.has.html) {
      const tabsHTML = new Utils.CreateDOM('div.minibed_tab.minibed_tabs_html')
      tabsHTML.setAttr('data-lang', 'htmlmixed')
      tabsHTML.setAttr('data-multiple', ref.options.files.html.length > 1)

      if (!foundActive) {
        tabsHTML.class('minibed_active')
        foundActive = true
      }

      const current = new Utils.CreateDOM('div.minibed_tabs_current')
        .setAttr('data-current', ref.options.files.html[0])
        .html(getProcessorNameFor(ref, 'html'))
      tabsHTML.append(current.el)

      if (ref.options.files.html.length > 1) {
        const dropdown = new Utils.CreateDOM('div.minibed_tabs_dropdown')

        let i = 0
        ref.options.files.html.forEach(file => {
          const tab = new Utils.CreateDOM('div.minibed_dropdown_item')
            .html(getShortName(file))
            .setAttr('data-file', file)

          if (i === 0) {
            tab.class('minibed_selected_tab')
          }

          dropdown.append(tab.el)
          i++
        })
        tabsHTML.append(dropdown.el)
      }

      tabs.append(tabsHTML.el)
    }

    if (ref.has.css) {
      const tabsCSS = new Utils.CreateDOM('div.minibed_tab.minibed_tabs_css')
      tabsCSS.setAttr('data-lang', 'css')
      tabsCSS.setAttr('data-multiple', ref.options.files.css.length > 1)

      if (!foundActive) {
        tabsCSS.class('minibed_active')
        foundActive = true
      }

      const current = new Utils.CreateDOM('div.minibed_tabs_current')
        .setAttr('data-current', ref.options.files.css[0])
        .html(getProcessorNameFor(ref, 'css'))
      tabsCSS.append(current.el)

      if (ref.options.files.css.length > 1) {
        const dropdown = new Utils.CreateDOM('div.minibed_tabs_dropdown')

        let i = 0
        ref.options.files.css.forEach(file => {
          const tab = new Utils.CreateDOM('div.minibed_dropdown_item')
            .html(getShortName(file))
            .setAttr('data-file', file)

          if (i === 0) {
            tab.class('minibed_selected_tab')
          }

          dropdown.append(tab.el)
          i++
        })
        tabsCSS.append(dropdown.el)
      }

      tabs.append(tabsCSS.el)
    }

    if (ref.has.js) {
      const tabsJS = new Utils.CreateDOM('div.minibed_tab.minibed_tabs_js')
      tabsJS.setAttr('data-lang', 'javascript')
      tabsJS.setAttr('data-multiple', ref.options.files.js.length > 1)

      if (!foundActive) {
        tabsJS.class('minibed_active')
      }

      const current = new Utils.CreateDOM('div.minibed_tabs_current')
        .setAttr('data-current', ref.options.files.js[0])
        .html(getProcessorNameFor(ref, 'js'))
      tabsJS.append(current.el)

      if (ref.options.files.js.length > 1) {
        const dropdown = new Utils.CreateDOM('div.minibed_tabs_dropdown')

        let i = 0
        ref.options.files.js.forEach(file => {
          const tab = new Utils.CreateDOM('div.minibed_dropdown_item')
            .html(getShortName(file))
            .setAttr('data-file', file)

          if (i === 0) {
            tab.class('minibed_selected_tab')
          }

          dropdown.append(tab.el)
          i++
        })
        tabsJS.append(dropdown.el)
      }

      tabs.append(tabsJS.el)
    }

    const result = new Utils.CreateDOM('div.minibed_tab_result').html(
      '<div class="minibed_checkbox-result"><input type="checkbox" id="minibed_checkbox-result" value="on"><label for="minibed_checkbox-result"></label> Live </div>'
    )

    tabs.append(result.el)

    ref.wrapper.appendChild(tabs.el)
  }

  function getShortName (name) {
    const parts = name.split('/')
    return parts[parts.length - 1]
  }

  /**
   * @param {Minibed} ref
   * @return {void}
   */
  function buildContents (ref) {
    const tabContents = new Utils.CreateDOM('div.minibed_tab_contents')
    let foundActive = false

    ref.loading = new Utils.CreateDOM('div.minibed_loading')
    tabContents.append(ref.loading.el)

    if (ref.has.html) {
      let i = 0
      ref.options.files.html.forEach(file => {
        const tabContent = new Utils.CreateDOM('textarea.minibed_tab_content')
          .setAttr('data-file', file)
          .setAttr('data-loaded', 'no')
          .setAttr('data-lang', 'htmlmixed')

        if (i === 0) {
          tabContent.class('minibed_selected_content')
        }

        if (!foundActive) {
          tabContent.class('minibed_active_tab')
          foundActive = true
        }

        tabContents.append(tabContent.el)
        i++
      })
    }

    if (ref.has.css) {
      let i = 0
      ref.options.files.css.forEach(file => {
        const tabContent = new Utils.CreateDOM('textarea.minibed_tab_content')
          .setAttr('data-file', file)
          .setAttr('data-loaded', 'no')
          .setAttr('data-lang', 'css')

        if (i === 0) {
          tabContent.class('minibed_selected_content')
        }

        if (!foundActive) {
          tabContent.class('minibed_active_tab')
          foundActive = true
        }

        tabContents.append(tabContent.el)
        i++
      })
    }

    if (ref.has.js) {
      let i = 0
      ref.options.files.js.forEach(file => {
        const tabContent = new Utils.CreateDOM('textarea.minibed_tab_content')
          .setAttr('data-file', file)
          .setAttr('data-loaded', 'no')
          .setAttr('data-lang', 'javascript')

        if (i === 0) {
          tabContent.class('minibed_selected_content')
        }

        if (!foundActive) {
          tabContent.class('minibed_active_tab')
          foundActive = true
        }

        tabContents.append(tabContent.el)
        i++
      })
    }

    const resultFrame = new Utils.CreateDOM('iframe.minibed_result_frame')
      .setAttr('src', 'about:blank')
      .setAttr('name', ref.id)
    tabContents.append(resultFrame.el)

    ref.wrapper.appendChild(tabContents.el)
  }

  /**
   * @param {Minibed} ref
   * @return {void}
   */
  function buildFooter (ref) {
    if (ref.options.notes.length > 0) {
      const footer = new Utils.CreateDOM('div.minibed_footer')

      ref.options.notes.forEach(note => {
        const p = new Utils.CreateDOM('p.minibed_footer_note').html(note)

        footer.append(p.el)
      })

      ref.wrapper.appendChild(footer.el)
    }
  }

  /**
   * @param {Minibed} ref
   * @return {void}
   */
  function findOrCreateContainer (ref) {
    if (ref.options.container) {
      ref.container = document.querySelector(ref.options.container)
    }
  }

  return {
      FileTypes,
      Includes,
      Defaults,
      build
  }
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/mode/javascript/javascript',["../../CodeMirror"], function(CodeMirror) {


CodeMirror.defineMode("javascript", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonldMode = parserConfig.jsonld;
  var jsonMode = parserConfig.json || jsonldMode;
  var isTS = parserConfig.typescript;
  var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c"), D = kw("keyword d");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

    return {
      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": D, "break": D, "continue": D, "new": kw("new"), "delete": C, "void": C, "throw": C,
      "debugger": kw("debugger"), "var": kw("var"), "const": kw("var"), "let": kw("var"),
      "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
      "this": kw("this"), "class": kw("class"), "super": kw("atom"),
      "yield": C, "export": kw("export"), "import": kw("import"), "extends": C,
      "await": C
    };
  }();

  var isOperatorChar = /[+\-*&%=<>!?|~^@]/;
  var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;

  function readRegexp(stream) {
    var escaped = false, next, inSet = false;
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if (next == "/" && !inSet) return;
        if (next == "[") inSet = true;
        else if (inSet && next == "]") inSet = false;
      }
      escaped = !escaped && next == "\\";
    }
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "." && stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
      return ret("number", "number");
    } else if (ch == "." && stream.match("..")) {
      return ret("spread", "meta");
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "=" && stream.eat(">")) {
      return ret("=>", "operator");
    } else if (ch == "0" && stream.match(/^(?:x[\da-f]+|o[0-7]+|b[01]+)n?/i)) {
      return ret("number", "number");
    } else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:n|(?:\.\d*)?(?:[eE][+\-]?\d+)?)?/);
      return ret("number", "number");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else if (expressionAllowed(stream, state, 1)) {
        readRegexp(stream);
        stream.match(/^\b(([gimyus])(?![gimyus]*\2))+\b/);
        return ret("regexp", "string-2");
      } else {
        stream.eat("=");
        return ret("operator", "operator", stream.current());
      }
    } else if (ch == "`") {
      state.tokenize = tokenQuasi;
      return tokenQuasi(stream, state);
    } else if (ch == "#") {
      stream.skipToEnd();
      return ret("error", "error");
    } else if (isOperatorChar.test(ch)) {
      if (ch != ">" || !state.lexical || state.lexical.type != ">") {
        if (stream.eat("=")) {
          if (ch == "!" || ch == "=") stream.eat("=")
        } else if (/[<>*+\-]/.test(ch)) {
          stream.eat(ch)
          if (ch == ">") stream.eat(ch)
        }
      }
      return ret("operator", "operator", stream.current());
    } else if (wordRE.test(ch)) {
      stream.eatWhile(wordRE);
      var word = stream.current()
      if (state.lastType != ".") {
        if (keywords.propertyIsEnumerable(word)) {
          var kw = keywords[word]
          return ret(kw.type, kw.style, word)
        }
        if (word == "async" && stream.match(/^(\s|\/\*.*?\*\/)*[\[\(\w]/, false))
          return ret("async", "keyword", word)
      }
      return ret("variable", "variable", word)
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next;
      if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)){
        state.tokenize = tokenBase;
        return ret("jsonld-keyword", "meta");
      }
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenQuasi(stream, state) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && next == "\\";
    }
    return ret("quasi", "string-2", stream.current());
  }

  var brackets = "([{}])";
  // This is a crude lookahead trick to try and notice that we're
  // parsing the argument patterns for a fat-arrow function before we
  // actually hit the arrow token. It only works if the arrow is on
  // the same line as the arguments and there's no strange noise
  // (comments) in between. Fallback is to only notice when we hit the
  // arrow, and not declare the arguments as locals for the arrow
  // body.
  function findFatArrow(stream, state) {
    if (state.fatArrowAt) state.fatArrowAt = null;
    var arrow = stream.string.indexOf("=>", stream.start);
    if (arrow < 0) return;

    if (isTS) { // Try to skip TypeScript return type declarations after the arguments
      var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow))
      if (m) arrow = m.index
    }

    var depth = 0, sawSomething = false;
    for (var pos = arrow - 1; pos >= 0; --pos) {
      var ch = stream.string.charAt(pos);
      var bracket = brackets.indexOf(ch);
      if (bracket >= 0 && bracket < 3) {
        if (!depth) { ++pos; break; }
        if (--depth == 0) { if (ch == "(") sawSomething = true; break; }
      } else if (bracket >= 3 && bracket < 6) {
        ++depth;
      } else if (wordRE.test(ch)) {
        sawSomething = true;
      } else if (/["'\/]/.test(ch)) {
        return;
      } else if (sawSomething && !depth) {
        ++pos;
        break;
      }
    }
    if (sawSomething && !depth) state.fatArrowAt = pos;
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true, "this": true, "jsonld-keyword": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
    for (var cx = state.context; cx; cx = cx.prev) {
      for (var v = cx.vars; v; v = v.next)
        if (v.name == varname) return true;
    }
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc; cx.style = style;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }

  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function inList(name, list) {
    for (var v = list; v; v = v.next) if (v.name == name) return true
    return false;
  }
  function register(varname) {
    var state = cx.state;
    cx.marked = "def";
    if (state.context) {
      if (state.lexical.info == "var" && state.context && state.context.block) {
        // FIXME function decls are also not block scoped
        var newContext = registerVarScoped(varname, state.context)
        if (newContext != null) {
          state.context = newContext
          return
        }
      } else if (!inList(varname, state.localVars)) {
        state.localVars = new Var(varname, state.localVars)
        return
      }
    }
    // Fall through means this is global
    if (parserConfig.globalVars && !inList(varname, state.globalVars))
      state.globalVars = new Var(varname, state.globalVars)
  }
  function registerVarScoped(varname, context) {
    if (!context) {
      return null
    } else if (context.block) {
      var inner = registerVarScoped(varname, context.prev)
      if (!inner) return null
      if (inner == context.prev) return context
      return new Context(inner, context.vars, true)
    } else if (inList(varname, context.vars)) {
      return context
    } else {
      return new Context(context.prev, new Var(varname, context.vars), false)
    }
  }

  function isModifier(name) {
    return name == "public" || name == "private" || name == "protected" || name == "abstract" || name == "readonly"
  }

  // Combinators

  function Context(prev, vars, block) { this.prev = prev; this.vars = vars; this.block = block }
  function Var(name, next) { this.name = name; this.next = next }

  var defaultVars = new Var("this", new Var("arguments", null))
  function pushcontext() {
    cx.state.context = new Context(cx.state.context, cx.state.localVars, false)
    cx.state.localVars = defaultVars
  }
  function pushblockcontext() {
    cx.state.context = new Context(cx.state.context, cx.state.localVars, true)
    cx.state.localVars = null
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars
    cx.state.context = cx.state.context.prev
  }
  popcontext.lex = true
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state, indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      else for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
        indent = outer.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function exp(type) {
      if (type == wanted) return cont();
      else if (wanted == ";" || type == "}" || type == ")" || type == "]") return pass();
      else return cont(exp);
    };
    return exp;
  }

  function statement(type, value) {
    if (type == "var") return cont(pushlex("vardef", value), vardef, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), parenExpr, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "keyword d") return cx.stream.match(/^\s*$/, false) ? cont() : cont(pushlex("stat"), maybeexpression, expect(";"), poplex);
    if (type == "debugger") return cont(expect(";"));
    if (type == "{") return cont(pushlex("}"), pushblockcontext, block, poplex, popcontext);
    if (type == ";") return cont();
    if (type == "if") {
      if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex)
        cx.state.cc.pop()();
      return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
    }
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), forspec, statement, poplex);
    if (type == "class" || (isTS && value == "interface")) {
      cx.marked = "keyword"
      return cont(pushlex("form", type == "class" ? type : value), className, poplex)
    }
    if (type == "variable") {
      if (isTS && value == "declare") {
        cx.marked = "keyword"
        return cont(statement)
      } else if (isTS && (value == "module" || value == "enum" || value == "type") && cx.stream.match(/^\s*\w/, false)) {
        cx.marked = "keyword"
        if (value == "enum") return cont(enumdef);
        else if (value == "type") return cont(typename, expect("operator"), typeexpr, expect(";"));
        else return cont(pushlex("form"), pattern, expect("{"), pushlex("}"), block, poplex, poplex)
      } else if (isTS && value == "namespace") {
        cx.marked = "keyword"
        return cont(pushlex("form"), expression, statement, poplex)
      } else if (isTS && value == "abstract") {
        cx.marked = "keyword"
        return cont(statement)
      } else {
        return cont(pushlex("stat"), maybelabel);
      }
    }
    if (type == "switch") return cont(pushlex("form"), parenExpr, expect("{"), pushlex("}", "switch"), pushblockcontext,
                                      block, poplex, poplex, popcontext);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, maybeCatchBinding, statement, poplex, popcontext);
    if (type == "export") return cont(pushlex("stat"), afterExport, poplex);
    if (type == "import") return cont(pushlex("stat"), afterImport, poplex);
    if (type == "async") return cont(statement)
    if (value == "@") return cont(expression, statement)
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function maybeCatchBinding(type) {
    if (type == "(") return cont(funarg, expect(")"))
  }
  function expression(type, value) {
    return expressionInner(type, value, false);
  }
  function expressionNoComma(type, value) {
    return expressionInner(type, value, true);
  }
  function parenExpr(type) {
    if (type != "(") return pass()
    return cont(pushlex(")"), expression, expect(")"), poplex)
  }
  function expressionInner(type, value, noComma) {
    if (cx.state.fatArrowAt == cx.stream.start) {
      var body = noComma ? arrowBodyNoComma : arrowBody;
      if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, expect("=>"), body, popcontext);
      else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
    }

    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef, maybeop);
    if (type == "class" || (isTS && value == "interface")) { cx.marked = "keyword"; return cont(pushlex("form"), classExpression, poplex); }
    if (type == "keyword c" || type == "async") return cont(noComma ? expressionNoComma : expression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
    if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
    if (type == "{") return contCommasep(objprop, "}", null, maybeop);
    if (type == "quasi") return pass(quasi, maybeop);
    if (type == "new") return cont(maybeTarget(noComma));
    if (type == "import") return cont(expression);
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }

  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(expression);
    return maybeoperatorNoComma(type, value, false);
  }
  function maybeoperatorNoComma(type, value, noComma) {
    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
    var expr = noComma == false ? expression : expressionNoComma;
    if (type == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
    if (type == "operator") {
      if (/\+\+|--/.test(value) || isTS && value == "!") return cont(me);
      if (isTS && value == "<" && cx.stream.match(/^([^>]|<.*?>)*>\s*\(/, false))
        return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, me);
      if (value == "?") return cont(expression, expect(":"), expr);
      return cont(expr);
    }
    if (type == "quasi") { return pass(quasi, me); }
    if (type == ";") return;
    if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
    if (isTS && value == "as") { cx.marked = "keyword"; return cont(typeexpr, me) }
    if (type == "regexp") {
      cx.state.lastType = cx.marked = "operator"
      cx.stream.backUp(cx.stream.pos - cx.stream.start - 1)
      return cont(expr)
    }
  }
  function quasi(type, value) {
    if (type != "quasi") return pass();
    if (value.slice(value.length - 2) != "${") return cont(quasi);
    return cont(expression, continueQuasi);
  }
  function continueQuasi(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont(quasi);
    }
  }
  function arrowBody(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expression);
  }
  function arrowBodyNoComma(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expressionNoComma);
  }
  function maybeTarget(noComma) {
    return function(type) {
      if (type == ".") return cont(noComma ? targetNoComma : target);
      else if (type == "variable" && isTS) return cont(maybeTypeArgs, noComma ? maybeoperatorNoComma : maybeoperatorComma)
      else return pass(noComma ? expressionNoComma : expression);
    };
  }
  function target(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorComma); }
  }
  function targetNoComma(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorNoComma); }
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type, value) {
    if (type == "async") {
      cx.marked = "property";
      return cont(objprop);
    } else if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
      var m // Work around fat-arrow-detection complication for detecting typescript typed arrow params
      if (isTS && cx.state.fatArrowAt == cx.stream.start && (m = cx.stream.match(/^\s*:\s*/, false)))
        cx.state.fatArrowAt = cx.stream.pos + m[0].length
      return cont(afterprop);
    } else if (type == "number" || type == "string") {
      cx.marked = jsonldMode ? "property" : (cx.style + " property");
      return cont(afterprop);
    } else if (type == "jsonld-keyword") {
      return cont(afterprop);
    } else if (isTS && isModifier(value)) {
      cx.marked = "keyword"
      return cont(objprop)
    } else if (type == "[") {
      return cont(expression, maybetype, expect("]"), afterprop);
    } else if (type == "spread") {
      return cont(expressionNoComma, afterprop);
    } else if (value == "*") {
      cx.marked = "keyword";
      return cont(objprop);
    } else if (type == ":") {
      return pass(afterprop)
    }
  }
  function getterSetter(type) {
    if (type != "variable") return pass(afterprop);
    cx.marked = "property";
    return cont(functiondef);
  }
  function afterprop(type) {
    if (type == ":") return cont(expressionNoComma);
    if (type == "(") return pass(functiondef);
  }
  function commasep(what, end, sep) {
    function proceed(type, value) {
      if (sep ? sep.indexOf(type) > -1 : type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(function(type, value) {
          if (type == end || value == end) return pass()
          return pass(what)
        }, proceed);
      }
      if (type == end || value == end) return cont();
      if (sep && sep.indexOf(";") > -1) return pass(what)
      return cont(expect(end));
    }
    return function(type, value) {
      if (type == end || value == end) return cont();
      return pass(what, proceed);
    };
  }
  function contCommasep(what, end, info) {
    for (var i = 3; i < arguments.length; i++)
      cx.cc.push(arguments[i]);
    return cont(pushlex(end, info), commasep(what, end), poplex);
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type, value) {
    if (isTS) {
      if (type == ":" || value == "in") return cont(typeexpr);
      if (value == "?") return cont(maybetype);
    }
  }
  function mayberettype(type) {
    if (isTS && type == ":") {
      if (cx.stream.match(/^\s*\w+\s+is\b/, false)) return cont(expression, isKW, typeexpr)
      else return cont(typeexpr)
    }
  }
  function isKW(_, value) {
    if (value == "is") {
      cx.marked = "keyword"
      return cont()
    }
  }
  function typeexpr(type, value) {
    if (value == "keyof" || value == "typeof" || value == "infer") {
      cx.marked = "keyword"
      return cont(value == "typeof" ? expressionNoComma : typeexpr)
    }
    if (type == "variable" || value == "void") {
      cx.marked = "type"
      return cont(afterType)
    }
    if (value == "|" || value == "&") return cont(typeexpr)
    if (type == "string" || type == "number" || type == "atom") return cont(afterType);
    if (type == "[") return cont(pushlex("]"), commasep(typeexpr, "]", ","), poplex, afterType)
    if (type == "{") return cont(pushlex("}"), commasep(typeprop, "}", ",;"), poplex, afterType)
    if (type == "(") return cont(commasep(typearg, ")"), maybeReturnType, afterType)
    if (type == "<") return cont(commasep(typeexpr, ">"), typeexpr)
  }
  function maybeReturnType(type) {
    if (type == "=>") return cont(typeexpr)
  }
  function typeprop(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property"
      return cont(typeprop)
    } else if (value == "?" || type == "number" || type == "string") {
      return cont(typeprop)
    } else if (type == ":") {
      return cont(typeexpr)
    } else if (type == "[") {
      return cont(expect("variable"), maybetype, expect("]"), typeprop)
    } else if (type == "(") {
      return pass(functiondecl, typeprop)
    }
  }
  function typearg(type, value) {
    if (type == "variable" && cx.stream.match(/^\s*[?:]/, false) || value == "?") return cont(typearg)
    if (type == ":") return cont(typeexpr)
    if (type == "spread") return cont(typearg)
    return pass(typeexpr)
  }
  function afterType(type, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType)
    if (value == "|" || type == "." || value == "&") return cont(typeexpr)
    if (type == "[") return cont(typeexpr, expect("]"), afterType)
    if (value == "extends" || value == "implements") { cx.marked = "keyword"; return cont(typeexpr) }
    if (value == "?") return cont(typeexpr, expect(":"), typeexpr)
  }
  function maybeTypeArgs(_, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType)
  }
  function typeparam() {
    return pass(typeexpr, maybeTypeDefault)
  }
  function maybeTypeDefault(_, value) {
    if (value == "=") return cont(typeexpr)
  }
  function vardef(_, value) {
    if (value == "enum") {cx.marked = "keyword"; return cont(enumdef)}
    return pass(pattern, maybetype, maybeAssign, vardefCont);
  }
  function pattern(type, value) {
    if (isTS && isModifier(value)) { cx.marked = "keyword"; return cont(pattern) }
    if (type == "variable") { register(value); return cont(); }
    if (type == "spread") return cont(pattern);
    if (type == "[") return contCommasep(eltpattern, "]");
    if (type == "{") return contCommasep(proppattern, "}");
  }
  function proppattern(type, value) {
    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
      register(value);
      return cont(maybeAssign);
    }
    if (type == "variable") cx.marked = "property";
    if (type == "spread") return cont(pattern);
    if (type == "}") return pass();
    if (type == "[") return cont(expression, expect(']'), expect(':'), proppattern);
    return cont(expect(":"), pattern, maybeAssign);
  }
  function eltpattern() {
    return pass(pattern, maybeAssign)
  }
  function maybeAssign(_type, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function vardefCont(type) {
    if (type == ",") return cont(vardef);
  }
  function maybeelse(type, value) {
    if (type == "keyword b" && value == "else") return cont(pushlex("form", "else"), statement, poplex);
  }
  function forspec(type, value) {
    if (value == "await") return cont(forspec);
    if (type == "(") return cont(pushlex(")"), forspec1, poplex);
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef, forspec2);
    if (type == "variable") return cont(forspec2);
    return pass(forspec2)
  }
  function forspec2(type, value) {
    if (type == ")") return cont()
    if (type == ";") return cont(forspec2)
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression, forspec2) }
    return pass(expression, forspec2)
  }
  function functiondef(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondef);}
    if (type == "variable") {register(value); return cont(functiondef);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, statement, popcontext);
    if (isTS && value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondef)
  }
  function functiondecl(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondecl);}
    if (type == "variable") {register(value); return cont(functiondecl);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, popcontext);
    if (isTS && value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondecl)
  }
  function typename(type, value) {
    if (type == "keyword" || type == "variable") {
      cx.marked = "type"
      return cont(typename)
    } else if (value == "<") {
      return cont(pushlex(">"), commasep(typeparam, ">"), poplex)
    }
  }
  function funarg(type, value) {
    if (value == "@") cont(expression, funarg)
    if (type == "spread") return cont(funarg);
    if (isTS && isModifier(value)) { cx.marked = "keyword"; return cont(funarg); }
    if (isTS && type == "this") return cont(maybetype, maybeAssign)
    return pass(pattern, maybetype, maybeAssign);
  }
  function classExpression(type, value) {
    // Class expressions may have an optional name.
    if (type == "variable") return className(type, value);
    return classNameAfter(type, value);
  }
  function className(type, value) {
    if (type == "variable") {register(value); return cont(classNameAfter);}
  }
  function classNameAfter(type, value) {
    if (value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, classNameAfter)
    if (value == "extends" || value == "implements" || (isTS && type == ",")) {
      if (value == "implements") cx.marked = "keyword";
      return cont(isTS ? typeexpr : expression, classNameAfter);
    }
    if (type == "{") return cont(pushlex("}"), classBody, poplex);
  }
  function classBody(type, value) {
    if (type == "async" ||
        (type == "variable" &&
         (value == "static" || value == "get" || value == "set" || (isTS && isModifier(value))) &&
         cx.stream.match(/^\s+[\w$\xa1-\uffff]/, false))) {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      return cont(isTS ? classfield : functiondef, classBody);
    }
    if (type == "number" || type == "string") return cont(isTS ? classfield : functiondef, classBody);
    if (type == "[")
      return cont(expression, maybetype, expect("]"), isTS ? classfield : functiondef, classBody)
    if (value == "*") {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (isTS && type == "(") return pass(functiondecl, classBody)
    if (type == ";" || type == ",") return cont(classBody);
    if (type == "}") return cont();
    if (value == "@") return cont(expression, classBody)
  }
  function classfield(type, value) {
    if (value == "?") return cont(classfield)
    if (type == ":") return cont(typeexpr, maybeAssign)
    if (value == "=") return cont(expressionNoComma)
    var context = cx.state.lexical.prev, isInterface = context && context.info == "interface"
    return pass(isInterface ? functiondecl : functiondef)
  }
  function afterExport(type, value) {
    if (value == "*") { cx.marked = "keyword"; return cont(maybeFrom, expect(";")); }
    if (value == "default") { cx.marked = "keyword"; return cont(expression, expect(";")); }
    if (type == "{") return cont(commasep(exportField, "}"), maybeFrom, expect(";"));
    return pass(statement);
  }
  function exportField(type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(expect("variable")); }
    if (type == "variable") return pass(expressionNoComma, exportField);
  }
  function afterImport(type) {
    if (type == "string") return cont();
    if (type == "(") return pass(expression);
    return pass(importSpec, maybeMoreImports, maybeFrom);
  }
  function importSpec(type, value) {
    if (type == "{") return contCommasep(importSpec, "}");
    if (type == "variable") register(value);
    if (value == "*") cx.marked = "keyword";
    return cont(maybeAs);
  }
  function maybeMoreImports(type) {
    if (type == ",") return cont(importSpec, maybeMoreImports)
  }
  function maybeAs(_type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(importSpec); }
  }
  function maybeFrom(_type, value) {
    if (value == "from") { cx.marked = "keyword"; return cont(expression); }
  }
  function arrayLiteral(type) {
    if (type == "]") return cont();
    return pass(commasep(expressionNoComma, "]"));
  }
  function enumdef() {
    return pass(pushlex("form"), pattern, expect("{"), pushlex("}"), commasep(enummember, "}"), poplex, poplex)
  }
  function enummember() {
    return pass(pattern, maybeAssign);
  }

  function isContinuedStatement(state, textAfter) {
    return state.lastType == "operator" || state.lastType == "," ||
      isOperatorChar.test(textAfter.charAt(0)) ||
      /[,.]/.test(textAfter.charAt(0));
  }

  function expressionAllowed(stream, state, backUp) {
    return state.tokenize == tokenBase &&
      /^(?:operator|sof|keyword [bcd]|case|new|export|default|spread|[\[{}\(,;:]|=>)$/.test(state.lastType) ||
      (state.lastType == "quasi" && /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0))))
  }

  // Interface

  return {
    startState: function(basecolumn) {
      var state = {
        tokenize: tokenBase,
        lastType: "sof",
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && new Context(null, null, false),
        indented: basecolumn || 0
      };
      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
        state.globalVars = parserConfig.globalVars;
      return state;
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
        findFatArrow(stream, state);
      }
      if (state.tokenize != tokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize == tokenComment) return CodeMirror.Pass;
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top
      // Kludge to prevent 'maybelse' from blocking lexical scope pops
      if (!/^\s*else\b/.test(textAfter)) for (var i = state.cc.length - 1; i >= 0; --i) {
        var c = state.cc[i];
        if (c == poplex) lexical = lexical.prev;
        else if (c != maybeelse) break;
      }
      while ((lexical.type == "stat" || lexical.type == "form") &&
             (firstChar == "}" || ((top = state.cc[state.cc.length - 1]) &&
                                   (top == maybeoperatorComma || top == maybeoperatorNoComma) &&
                                   !/^[,\.=+\-*:?[\(]/.test(textAfter))))
        lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
        lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;

      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info.length + 1 : 0);
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "form") return lexical.indented + indentUnit;
      else if (type == "stat")
        return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || indentUnit : 0);
      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    blockCommentContinue: jsonMode ? null : " * ",
    lineComment: jsonMode ? null : "//",
    fold: "brace",
    closeBrackets: "()[]{}''\"\"``",

    helperType: jsonMode ? "json" : "javascript",
    jsonldMode: jsonldMode,
    jsonMode: jsonMode,

    expressionAllowed: expressionAllowed,

    skipExpression: function(state) {
      var top = state.cc[state.cc.length - 1]
      if (top == expression || top == expressionNoComma) state.cc.pop()
    }
  };
});

CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/x-javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/x-json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/ld+json", {name: "javascript", jsonld: true});
CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });

});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/mode/xml/xml',["../../CodeMirror"], function(CodeMirror) {


var htmlConfig = {
  autoSelfClosers: {'area': true, 'base': true, 'br': true, 'col': true, 'command': true,
                    'embed': true, 'frame': true, 'hr': true, 'img': true, 'input': true,
                    'keygen': true, 'link': true, 'meta': true, 'param': true, 'source': true,
                    'track': true, 'wbr': true, 'menuitem': true},
  implicitlyClosed: {'dd': true, 'li': true, 'optgroup': true, 'option': true, 'p': true,
                     'rp': true, 'rt': true, 'tbody': true, 'td': true, 'tfoot': true,
                     'th': true, 'tr': true},
  contextGrabbers: {
    'dd': {'dd': true, 'dt': true},
    'dt': {'dd': true, 'dt': true},
    'li': {'li': true},
    'option': {'option': true, 'optgroup': true},
    'optgroup': {'optgroup': true},
    'p': {'address': true, 'article': true, 'aside': true, 'blockquote': true, 'dir': true,
          'div': true, 'dl': true, 'fieldset': true, 'footer': true, 'form': true,
          'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true,
          'header': true, 'hgroup': true, 'hr': true, 'menu': true, 'nav': true, 'ol': true,
          'p': true, 'pre': true, 'section': true, 'table': true, 'ul': true},
    'rp': {'rp': true, 'rt': true},
    'rt': {'rp': true, 'rt': true},
    'tbody': {'tbody': true, 'tfoot': true},
    'td': {'td': true, 'th': true},
    'tfoot': {'tbody': true},
    'th': {'td': true, 'th': true},
    'thead': {'tbody': true, 'tfoot': true},
    'tr': {'tr': true}
  },
  doNotIndent: {"pre": true},
  allowUnquoted: true,
  allowMissing: true,
  caseFold: true
}

var xmlConfig = {
  autoSelfClosers: {},
  implicitlyClosed: {},
  contextGrabbers: {},
  doNotIndent: {},
  allowUnquoted: false,
  allowMissing: false,
  allowMissingTagName: false,
  caseFold: false
}

CodeMirror.defineMode("xml", function(editorConf, config_) {
  var indentUnit = editorConf.indentUnit
  var config = {}
  var defaults = config_.htmlMode ? htmlConfig : xmlConfig
  for (var prop in defaults) config[prop] = defaults[prop]
  for (var prop in config_) config[prop] = config_[prop]

  // Return variables for tokenizers
  var type, setStyle;

  function inText(stream, state) {
    function chain(parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }

    var ch = stream.next();
    if (ch == "<") {
      if (stream.eat("!")) {
        if (stream.eat("[")) {
          if (stream.match("CDATA[")) return chain(inBlock("atom", "]]>"));
          else return null;
        } else if (stream.match("--")) {
          return chain(inBlock("comment", "-->"));
        } else if (stream.match("DOCTYPE", true, true)) {
          stream.eatWhile(/[\w\._\-]/);
          return chain(doctype(1));
        } else {
          return null;
        }
      } else if (stream.eat("?")) {
        stream.eatWhile(/[\w\._\-]/);
        state.tokenize = inBlock("meta", "?>");
        return "meta";
      } else {
        type = stream.eat("/") ? "closeTag" : "openTag";
        state.tokenize = inTag;
        return "tag bracket";
      }
    } else if (ch == "&") {
      var ok;
      if (stream.eat("#")) {
        if (stream.eat("x")) {
          ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(";");
        } else {
          ok = stream.eatWhile(/[\d]/) && stream.eat(";");
        }
      } else {
        ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(";");
      }
      return ok ? "atom" : "error";
    } else {
      stream.eatWhile(/[^&<]/);
      return null;
    }
  }
  inText.isInText = true;

  function inTag(stream, state) {
    var ch = stream.next();
    if (ch == ">" || (ch == "/" && stream.eat(">"))) {
      state.tokenize = inText;
      type = ch == ">" ? "endTag" : "selfcloseTag";
      return "tag bracket";
    } else if (ch == "=") {
      type = "equals";
      return null;
    } else if (ch == "<") {
      state.tokenize = inText;
      state.state = baseState;
      state.tagName = state.tagStart = null;
      var next = state.tokenize(stream, state);
      return next ? next + " tag error" : "tag error";
    } else if (/[\'\"]/.test(ch)) {
      state.tokenize = inAttribute(ch);
      state.stringStartCol = stream.column();
      return state.tokenize(stream, state);
    } else {
      stream.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/);
      return "word";
    }
  }

  function inAttribute(quote) {
    var closure = function(stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inTag;
          break;
        }
      }
      return "string";
    };
    closure.isInAttribute = true;
    return closure;
  }

  function inBlock(style, terminator) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = inText;
          break;
        }
        stream.next();
      }
      return style;
    }
  }

  function doctype(depth) {
    return function(stream, state) {
      var ch;
      while ((ch = stream.next()) != null) {
        if (ch == "<") {
          state.tokenize = doctype(depth + 1);
          return state.tokenize(stream, state);
        } else if (ch == ">") {
          if (depth == 1) {
            state.tokenize = inText;
            break;
          } else {
            state.tokenize = doctype(depth - 1);
            return state.tokenize(stream, state);
          }
        }
      }
      return "meta";
    };
  }

  function Context(state, tagName, startOfLine) {
    this.prev = state.context;
    this.tagName = tagName;
    this.indent = state.indented;
    this.startOfLine = startOfLine;
    if (config.doNotIndent.hasOwnProperty(tagName) || (state.context && state.context.noIndent))
      this.noIndent = true;
  }
  function popContext(state) {
    if (state.context) state.context = state.context.prev;
  }
  function maybePopContext(state, nextTagName) {
    var parentTagName;
    while (true) {
      if (!state.context) {
        return;
      }
      parentTagName = state.context.tagName;
      if (!config.contextGrabbers.hasOwnProperty(parentTagName) ||
          !config.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)) {
        return;
      }
      popContext(state);
    }
  }

  function baseState(type, stream, state) {
    if (type == "openTag") {
      state.tagStart = stream.column();
      return tagNameState;
    } else if (type == "closeTag") {
      return closeTagNameState;
    } else {
      return baseState;
    }
  }
  function tagNameState(type, stream, state) {
    if (type == "word") {
      state.tagName = stream.current();
      setStyle = "tag";
      return attrState;
    } else if (config.allowMissingTagName && type == "endTag") {
      setStyle = "tag bracket";
      return attrState(type, stream, state);
    } else {
      setStyle = "error";
      return tagNameState;
    }
  }
  function closeTagNameState(type, stream, state) {
    if (type == "word") {
      var tagName = stream.current();
      if (state.context && state.context.tagName != tagName &&
          config.implicitlyClosed.hasOwnProperty(state.context.tagName))
        popContext(state);
      if ((state.context && state.context.tagName == tagName) || config.matchClosing === false) {
        setStyle = "tag";
        return closeState;
      } else {
        setStyle = "tag error";
        return closeStateErr;
      }
    } else if (config.allowMissingTagName && type == "endTag") {
      setStyle = "tag bracket";
      return closeState(type, stream, state);
    } else {
      setStyle = "error";
      return closeStateErr;
    }
  }

  function closeState(type, _stream, state) {
    if (type != "endTag") {
      setStyle = "error";
      return closeState;
    }
    popContext(state);
    return baseState;
  }
  function closeStateErr(type, stream, state) {
    setStyle = "error";
    return closeState(type, stream, state);
  }

  function attrState(type, _stream, state) {
    if (type == "word") {
      setStyle = "attribute";
      return attrEqState;
    } else if (type == "endTag" || type == "selfcloseTag") {
      var tagName = state.tagName, tagStart = state.tagStart;
      state.tagName = state.tagStart = null;
      if (type == "selfcloseTag" ||
          config.autoSelfClosers.hasOwnProperty(tagName)) {
        maybePopContext(state, tagName);
      } else {
        maybePopContext(state, tagName);
        state.context = new Context(state, tagName, tagStart == state.indented);
      }
      return baseState;
    }
    setStyle = "error";
    return attrState;
  }
  function attrEqState(type, stream, state) {
    if (type == "equals") return attrValueState;
    if (!config.allowMissing) setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrValueState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    if (type == "word" && config.allowUnquoted) {setStyle = "string"; return attrState;}
    setStyle = "error";
    return attrState(type, stream, state);
  }
  function attrContinuedState(type, stream, state) {
    if (type == "string") return attrContinuedState;
    return attrState(type, stream, state);
  }

  return {
    startState: function(baseIndent) {
      var state = {tokenize: inText,
                   state: baseState,
                   indented: baseIndent || 0,
                   tagName: null, tagStart: null,
                   context: null}
      if (baseIndent != null) state.baseIndent = baseIndent
      return state
    },

    token: function(stream, state) {
      if (!state.tagName && stream.sol())
        state.indented = stream.indentation();

      if (stream.eatSpace()) return null;
      type = null;
      var style = state.tokenize(stream, state);
      if ((style || type) && style != "comment") {
        setStyle = null;
        state.state = state.state(type || style, stream, state);
        if (setStyle)
          style = setStyle == "error" ? style + " error" : setStyle;
      }
      return style;
    },

    indent: function(state, textAfter, fullLine) {
      var context = state.context;
      // Indent multi-line strings (e.g. css).
      if (state.tokenize.isInAttribute) {
        if (state.tagStart == state.indented)
          return state.stringStartCol + 1;
        else
          return state.indented + indentUnit;
      }
      if (context && context.noIndent) return CodeMirror.Pass;
      if (state.tokenize != inTag && state.tokenize != inText)
        return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0;
      // Indent the starts of attribute names.
      if (state.tagName) {
        if (config.multilineTagIndentPastTag !== false)
          return state.tagStart + state.tagName.length + 2;
        else
          return state.tagStart + indentUnit * (config.multilineTagIndentFactor || 1);
      }
      if (config.alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0;
      var tagAfter = textAfter && /^<(\/)?([\w_:\.-]*)/.exec(textAfter);
      if (tagAfter && tagAfter[1]) { // Closing tag spotted
        while (context) {
          if (context.tagName == tagAfter[2]) {
            context = context.prev;
            break;
          } else if (config.implicitlyClosed.hasOwnProperty(context.tagName)) {
            context = context.prev;
          } else {
            break;
          }
        }
      } else if (tagAfter) { // Opening tag spotted
        while (context) {
          var grabbers = config.contextGrabbers[context.tagName];
          if (grabbers && grabbers.hasOwnProperty(tagAfter[2]))
            context = context.prev;
          else
            break;
        }
      }
      while (context && context.prev && !context.startOfLine)
        context = context.prev;
      if (context) return context.indent + indentUnit;
      else return state.baseIndent || 0;
    },

    electricInput: /<\/[\s\w:]+>$/,
    blockCommentStart: "<!--",
    blockCommentEnd: "-->",

    configuration: config.htmlMode ? "html" : "xml",
    helperType: config.htmlMode ? "html" : "xml",

    skipAttribute: function(state) {
      if (state.state == attrValueState)
        state.state = attrState
    }
  };
});

CodeMirror.defineMIME("text/xml", "xml");
CodeMirror.defineMIME("application/xml", "xml");
if (!CodeMirror.mimeModes.hasOwnProperty("text/html"))
  CodeMirror.defineMIME("text/html", {name: "xml", htmlMode: true});

});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/mode/css/css',["../../CodeMirror"], function(CodeMirror) {


CodeMirror.defineMode("css", function(config, parserConfig) {
  var inline = parserConfig.inline
  if (!parserConfig.propertyKeywords) parserConfig = CodeMirror.resolveMode("text/css");

  var indentUnit = config.indentUnit,
      tokenHooks = parserConfig.tokenHooks,
      documentTypes = parserConfig.documentTypes || {},
      mediaTypes = parserConfig.mediaTypes || {},
      mediaFeatures = parserConfig.mediaFeatures || {},
      mediaValueKeywords = parserConfig.mediaValueKeywords || {},
      propertyKeywords = parserConfig.propertyKeywords || {},
      nonStandardPropertyKeywords = parserConfig.nonStandardPropertyKeywords || {},
      fontProperties = parserConfig.fontProperties || {},
      counterDescriptors = parserConfig.counterDescriptors || {},
      colorKeywords = parserConfig.colorKeywords || {},
      valueKeywords = parserConfig.valueKeywords || {},
      allowNested = parserConfig.allowNested,
      lineComment = parserConfig.lineComment,
      supportsAtComponent = parserConfig.supportsAtComponent === true;

  var type, override;
  function ret(style, tp) { type = tp; return style; }

  // Tokenizers

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (tokenHooks[ch]) {
      var result = tokenHooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == "@") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("def", stream.current());
    } else if (ch == "=" || (ch == "~" || ch == "|") && stream.eat("=")) {
      return ret(null, "compare");
    } else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "#") {
      stream.eatWhile(/[\w\\\-]/);
      return ret("atom", "hash");
    } else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    } else if (/\d/.test(ch) || ch == "." && stream.eat(/\d/)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    } else if (ch === "-") {
      if (/[\d.]/.test(stream.peek())) {
        stream.eatWhile(/[\w.%]/);
        return ret("number", "unit");
      } else if (stream.match(/^-[\w\\\-]*/)) {
        stream.eatWhile(/[\w\\\-]/);
        if (stream.match(/^\s*:/, false))
          return ret("variable-2", "variable-definition");
        return ret("variable-2", "variable");
      } else if (stream.match(/^\w+-/)) {
        return ret("meta", "meta");
      }
    } else if (/[,+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    } else if (ch == "." && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) {
      return ret("qualifier", "qualifier");
    } else if (/[:;{}\[\]\(\)]/.test(ch)) {
      return ret(null, ch);
    } else if (stream.match(/[\w-.]+(?=\()/)) {
      if (/^(url(-prefix)?|domain|regexp)$/.test(stream.current().toLowerCase())) {
        state.tokenize = tokenParenthesized;
      }
      return ret("variable callee", "variable");
    } else if (/[\w\\\-]/.test(ch)) {
      stream.eatWhile(/[\w\\\-]/);
      return ret("property", "word");
    } else {
      return ret(null, null);
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          if (quote == ")") stream.backUp(1);
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      if (ch == quote || !escaped && quote != ")") state.tokenize = null;
      return ret("string", "string");
    };
  }

  function tokenParenthesized(stream, state) {
    stream.next(); // Must be '('
    if (!stream.match(/\s*[\"\')]/, false))
      state.tokenize = tokenString(")");
    else
      state.tokenize = null;
    return ret(null, "(");
  }

  // Context management

  function Context(type, indent, prev) {
    this.type = type;
    this.indent = indent;
    this.prev = prev;
  }

  function pushContext(state, stream, type, indent) {
    state.context = new Context(type, stream.indentation() + (indent === false ? 0 : indentUnit), state.context);
    return type;
  }

  function popContext(state) {
    if (state.context.prev)
      state.context = state.context.prev;
    return state.context.type;
  }

  function pass(type, stream, state) {
    return states[state.context.type](type, stream, state);
  }
  function popAndPass(type, stream, state, n) {
    for (var i = n || 1; i > 0; i--)
      state.context = state.context.prev;
    return pass(type, stream, state);
  }

  // Parser

  function wordAsValue(stream) {
    var word = stream.current().toLowerCase();
    if (valueKeywords.hasOwnProperty(word))
      override = "atom";
    else if (colorKeywords.hasOwnProperty(word))
      override = "keyword";
    else
      override = "variable";
  }

  var states = {};

  states.top = function(type, stream, state) {
    if (type == "{") {
      return pushContext(state, stream, "block");
    } else if (type == "}" && state.context.prev) {
      return popContext(state);
    } else if (supportsAtComponent && /@component/i.test(type)) {
      return pushContext(state, stream, "atComponentBlock");
    } else if (/^@(-moz-)?document$/i.test(type)) {
      return pushContext(state, stream, "documentTypes");
    } else if (/^@(media|supports|(-moz-)?document|import)$/i.test(type)) {
      return pushContext(state, stream, "atBlock");
    } else if (/^@(font-face|counter-style)/i.test(type)) {
      state.stateArg = type;
      return "restricted_atBlock_before";
    } else if (/^@(-(moz|ms|o|webkit)-)?keyframes$/i.test(type)) {
      return "keyframes";
    } else if (type && type.charAt(0) == "@") {
      return pushContext(state, stream, "at");
    } else if (type == "hash") {
      override = "builtin";
    } else if (type == "word") {
      override = "tag";
    } else if (type == "variable-definition") {
      return "maybeprop";
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    } else if (type == ":") {
      return "pseudo";
    } else if (allowNested && type == "(") {
      return pushContext(state, stream, "parens");
    }
    return state.context.type;
  };

  states.block = function(type, stream, state) {
    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (propertyKeywords.hasOwnProperty(word)) {
        override = "property";
        return "maybeprop";
      } else if (nonStandardPropertyKeywords.hasOwnProperty(word)) {
        override = "string-2";
        return "maybeprop";
      } else if (allowNested) {
        override = stream.match(/^\s*:(?:\s|$)/, false) ? "property" : "tag";
        return "block";
      } else {
        override += " error";
        return "maybeprop";
      }
    } else if (type == "meta") {
      return "block";
    } else if (!allowNested && (type == "hash" || type == "qualifier")) {
      override = "error";
      return "block";
    } else {
      return states.top(type, stream, state);
    }
  };

  states.maybeprop = function(type, stream, state) {
    if (type == ":") return pushContext(state, stream, "prop");
    return pass(type, stream, state);
  };

  states.prop = function(type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" && allowNested) return pushContext(state, stream, "propBlock");
    if (type == "}" || type == "{") return popAndPass(type, stream, state);
    if (type == "(") return pushContext(state, stream, "parens");

    if (type == "hash" && !/^#([0-9a-fA-f]{3,4}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(stream.current())) {
      override += " error";
    } else if (type == "word") {
      wordAsValue(stream);
    } else if (type == "interpolation") {
      return pushContext(state, stream, "interpolation");
    }
    return "prop";
  };

  states.propBlock = function(type, _stream, state) {
    if (type == "}") return popContext(state);
    if (type == "word") { override = "property"; return "maybeprop"; }
    return state.context.type;
  };

  states.parens = function(type, stream, state) {
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == ")") return popContext(state);
    if (type == "(") return pushContext(state, stream, "parens");
    if (type == "interpolation") return pushContext(state, stream, "interpolation");
    if (type == "word") wordAsValue(stream);
    return "parens";
  };

  states.pseudo = function(type, stream, state) {
    if (type == "meta") return "pseudo";

    if (type == "word") {
      override = "variable-3";
      return state.context.type;
    }
    return pass(type, stream, state);
  };

  states.documentTypes = function(type, stream, state) {
    if (type == "word" && documentTypes.hasOwnProperty(stream.current())) {
      override = "tag";
      return state.context.type;
    } else {
      return states.atBlock(type, stream, state);
    }
  };

  states.atBlock = function(type, stream, state) {
    if (type == "(") return pushContext(state, stream, "atBlock_parens");
    if (type == "}" || type == ";") return popAndPass(type, stream, state);
    if (type == "{") return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top");

    if (type == "interpolation") return pushContext(state, stream, "interpolation");

    if (type == "word") {
      var word = stream.current().toLowerCase();
      if (word == "only" || word == "not" || word == "and" || word == "or")
        override = "keyword";
      else if (mediaTypes.hasOwnProperty(word))
        override = "attribute";
      else if (mediaFeatures.hasOwnProperty(word))
        override = "property";
      else if (mediaValueKeywords.hasOwnProperty(word))
        override = "keyword";
      else if (propertyKeywords.hasOwnProperty(word))
        override = "property";
      else if (nonStandardPropertyKeywords.hasOwnProperty(word))
        override = "string-2";
      else if (valueKeywords.hasOwnProperty(word))
        override = "atom";
      else if (colorKeywords.hasOwnProperty(word))
        override = "keyword";
      else
        override = "error";
    }
    return state.context.type;
  };

  states.atComponentBlock = function(type, stream, state) {
    if (type == "}")
      return popAndPass(type, stream, state);
    if (type == "{")
      return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top", false);
    if (type == "word")
      override = "error";
    return state.context.type;
  };

  states.atBlock_parens = function(type, stream, state) {
    if (type == ")") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state, 2);
    return states.atBlock(type, stream, state);
  };

  states.restricted_atBlock_before = function(type, stream, state) {
    if (type == "{")
      return pushContext(state, stream, "restricted_atBlock");
    if (type == "word" && state.stateArg == "@counter-style") {
      override = "variable";
      return "restricted_atBlock_before";
    }
    return pass(type, stream, state);
  };

  states.restricted_atBlock = function(type, stream, state) {
    if (type == "}") {
      state.stateArg = null;
      return popContext(state);
    }
    if (type == "word") {
      if ((state.stateArg == "@font-face" && !fontProperties.hasOwnProperty(stream.current().toLowerCase())) ||
          (state.stateArg == "@counter-style" && !counterDescriptors.hasOwnProperty(stream.current().toLowerCase())))
        override = "error";
      else
        override = "property";
      return "maybeprop";
    }
    return "restricted_atBlock";
  };

  states.keyframes = function(type, stream, state) {
    if (type == "word") { override = "variable"; return "keyframes"; }
    if (type == "{") return pushContext(state, stream, "top");
    return pass(type, stream, state);
  };

  states.at = function(type, stream, state) {
    if (type == ";") return popContext(state);
    if (type == "{" || type == "}") return popAndPass(type, stream, state);
    if (type == "word") override = "tag";
    else if (type == "hash") override = "builtin";
    return "at";
  };

  states.interpolation = function(type, stream, state) {
    if (type == "}") return popContext(state);
    if (type == "{" || type == ";") return popAndPass(type, stream, state);
    if (type == "word") override = "variable";
    else if (type != "variable" && type != "(" && type != ")") override = "error";
    return "interpolation";
  };

  return {
    startState: function(base) {
      return {tokenize: null,
              state: inline ? "block" : "top",
              stateArg: null,
              context: new Context(inline ? "block" : "top", base || 0, null)};
    },

    token: function(stream, state) {
      if (!state.tokenize && stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style && typeof style == "object") {
        type = style[1];
        style = style[0];
      }
      override = style;
      if (type != "comment")
        state.state = states[state.state](type, stream, state);
      return override;
    },

    indent: function(state, textAfter) {
      var cx = state.context, ch = textAfter && textAfter.charAt(0);
      var indent = cx.indent;
      if (cx.type == "prop" && (ch == "}" || ch == ")")) cx = cx.prev;
      if (cx.prev) {
        if (ch == "}" && (cx.type == "block" || cx.type == "top" ||
                          cx.type == "interpolation" || cx.type == "restricted_atBlock")) {
          // Resume indentation from parent context.
          cx = cx.prev;
          indent = cx.indent;
        } else if (ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") ||
            ch == "{" && (cx.type == "at" || cx.type == "atBlock")) {
          // Dedent relative to current context.
          indent = Math.max(0, cx.indent - indentUnit);
        }
      }
      return indent;
    },

    electricChars: "}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    blockCommentContinue: " * ",
    lineComment: lineComment,
    fold: "brace"
  };
});

  function keySet(array) {
    var keys = {};
    for (var i = 0; i < array.length; ++i) {
      keys[array[i].toLowerCase()] = true;
    }
    return keys;
  }

  var documentTypes_ = [
    "domain", "regexp", "url", "url-prefix"
  ], documentTypes = keySet(documentTypes_);

  var mediaTypes_ = [
    "all", "aural", "braille", "handheld", "print", "projection", "screen",
    "tty", "tv", "embossed"
  ], mediaTypes = keySet(mediaTypes_);

  var mediaFeatures_ = [
    "width", "min-width", "max-width", "height", "min-height", "max-height",
    "device-width", "min-device-width", "max-device-width", "device-height",
    "min-device-height", "max-device-height", "aspect-ratio",
    "min-aspect-ratio", "max-aspect-ratio", "device-aspect-ratio",
    "min-device-aspect-ratio", "max-device-aspect-ratio", "color", "min-color",
    "max-color", "color-index", "min-color-index", "max-color-index",
    "monochrome", "min-monochrome", "max-monochrome", "resolution",
    "min-resolution", "max-resolution", "scan", "grid", "orientation",
    "device-pixel-ratio", "min-device-pixel-ratio", "max-device-pixel-ratio",
    "pointer", "any-pointer", "hover", "any-hover"
  ], mediaFeatures = keySet(mediaFeatures_);

  var mediaValueKeywords_ = [
    "landscape", "portrait", "none", "coarse", "fine", "on-demand", "hover",
    "interlace", "progressive"
  ], mediaValueKeywords = keySet(mediaValueKeywords_);

  var propertyKeywords_ = [
    "align-content", "align-items", "align-self", "alignment-adjust",
    "alignment-baseline", "anchor-point", "animation", "animation-delay",
    "animation-direction", "animation-duration", "animation-fill-mode",
    "animation-iteration-count", "animation-name", "animation-play-state",
    "animation-timing-function", "appearance", "azimuth", "backface-visibility",
    "background", "background-attachment", "background-blend-mode", "background-clip",
    "background-color", "background-image", "background-origin", "background-position",
    "background-repeat", "background-size", "baseline-shift", "binding",
    "bleed", "bookmark-label", "bookmark-level", "bookmark-state",
    "bookmark-target", "border", "border-bottom", "border-bottom-color",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "border-bottom-style", "border-bottom-width", "border-collapse",
    "border-color", "border-image", "border-image-outset",
    "border-image-repeat", "border-image-slice", "border-image-source",
    "border-image-width", "border-left", "border-left-color",
    "border-left-style", "border-left-width", "border-radius", "border-right",
    "border-right-color", "border-right-style", "border-right-width",
    "border-spacing", "border-style", "border-top", "border-top-color",
    "border-top-left-radius", "border-top-right-radius", "border-top-style",
    "border-top-width", "border-width", "bottom", "box-decoration-break",
    "box-shadow", "box-sizing", "break-after", "break-before", "break-inside",
    "caption-side", "caret-color", "clear", "clip", "color", "color-profile", "column-count",
    "column-fill", "column-gap", "column-rule", "column-rule-color",
    "column-rule-style", "column-rule-width", "column-span", "column-width",
    "columns", "content", "counter-increment", "counter-reset", "crop", "cue",
    "cue-after", "cue-before", "cursor", "direction", "display",
    "dominant-baseline", "drop-initial-after-adjust",
    "drop-initial-after-align", "drop-initial-before-adjust",
    "drop-initial-before-align", "drop-initial-size", "drop-initial-value",
    "elevation", "empty-cells", "fit", "fit-position", "flex", "flex-basis",
    "flex-direction", "flex-flow", "flex-grow", "flex-shrink", "flex-wrap",
    "float", "float-offset", "flow-from", "flow-into", "font", "font-feature-settings",
    "font-family", "font-kerning", "font-language-override", "font-size", "font-size-adjust",
    "font-stretch", "font-style", "font-synthesis", "font-variant",
    "font-variant-alternates", "font-variant-caps", "font-variant-east-asian",
    "font-variant-ligatures", "font-variant-numeric", "font-variant-position",
    "font-weight", "grid", "grid-area", "grid-auto-columns", "grid-auto-flow",
    "grid-auto-rows", "grid-column", "grid-column-end", "grid-column-gap",
    "grid-column-start", "grid-gap", "grid-row", "grid-row-end", "grid-row-gap",
    "grid-row-start", "grid-template", "grid-template-areas", "grid-template-columns",
    "grid-template-rows", "hanging-punctuation", "height", "hyphens",
    "icon", "image-orientation", "image-rendering", "image-resolution",
    "inline-box-align", "justify-content", "justify-items", "justify-self", "left", "letter-spacing",
    "line-break", "line-height", "line-stacking", "line-stacking-ruby",
    "line-stacking-shift", "line-stacking-strategy", "list-style",
    "list-style-image", "list-style-position", "list-style-type", "margin",
    "margin-bottom", "margin-left", "margin-right", "margin-top",
    "marks", "marquee-direction", "marquee-loop",
    "marquee-play-count", "marquee-speed", "marquee-style", "max-height",
    "max-width", "min-height", "min-width", "mix-blend-mode", "move-to", "nav-down", "nav-index",
    "nav-left", "nav-right", "nav-up", "object-fit", "object-position",
    "opacity", "order", "orphans", "outline",
    "outline-color", "outline-offset", "outline-style", "outline-width",
    "overflow", "overflow-style", "overflow-wrap", "overflow-x", "overflow-y",
    "padding", "padding-bottom", "padding-left", "padding-right", "padding-top",
    "page", "page-break-after", "page-break-before", "page-break-inside",
    "page-policy", "pause", "pause-after", "pause-before", "perspective",
    "perspective-origin", "pitch", "pitch-range", "place-content", "place-items", "place-self", "play-during", "position",
    "presentation-level", "punctuation-trim", "quotes", "region-break-after",
    "region-break-before", "region-break-inside", "region-fragment",
    "rendering-intent", "resize", "rest", "rest-after", "rest-before", "richness",
    "right", "rotation", "rotation-point", "ruby-align", "ruby-overhang",
    "ruby-position", "ruby-span", "shape-image-threshold", "shape-inside", "shape-margin",
    "shape-outside", "size", "speak", "speak-as", "speak-header",
    "speak-numeral", "speak-punctuation", "speech-rate", "stress", "string-set",
    "tab-size", "table-layout", "target", "target-name", "target-new",
    "target-position", "text-align", "text-align-last", "text-decoration",
    "text-decoration-color", "text-decoration-line", "text-decoration-skip",
    "text-decoration-style", "text-emphasis", "text-emphasis-color",
    "text-emphasis-position", "text-emphasis-style", "text-height",
    "text-indent", "text-justify", "text-outline", "text-overflow", "text-shadow",
    "text-size-adjust", "text-space-collapse", "text-transform", "text-underline-position",
    "text-wrap", "top", "transform", "transform-origin", "transform-style",
    "transition", "transition-delay", "transition-duration",
    "transition-property", "transition-timing-function", "unicode-bidi",
    "user-select", "vertical-align", "visibility", "voice-balance", "voice-duration",
    "voice-family", "voice-pitch", "voice-range", "voice-rate", "voice-stress",
    "voice-volume", "volume", "white-space", "widows", "width", "will-change", "word-break",
    "word-spacing", "word-wrap", "z-index",
    // SVG-specific
    "clip-path", "clip-rule", "mask", "enable-background", "filter", "flood-color",
    "flood-opacity", "lighting-color", "stop-color", "stop-opacity", "pointer-events",
    "color-interpolation", "color-interpolation-filters",
    "color-rendering", "fill", "fill-opacity", "fill-rule", "image-rendering",
    "marker", "marker-end", "marker-mid", "marker-start", "shape-rendering", "stroke",
    "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
    "stroke-miterlimit", "stroke-opacity", "stroke-width", "text-rendering",
    "baseline-shift", "dominant-baseline", "glyph-orientation-horizontal",
    "glyph-orientation-vertical", "text-anchor", "writing-mode"
  ], propertyKeywords = keySet(propertyKeywords_);

  var nonStandardPropertyKeywords_ = [
    "scrollbar-arrow-color", "scrollbar-base-color", "scrollbar-dark-shadow-color",
    "scrollbar-face-color", "scrollbar-highlight-color", "scrollbar-shadow-color",
    "scrollbar-3d-light-color", "scrollbar-track-color", "shape-inside",
    "searchfield-cancel-button", "searchfield-decoration", "searchfield-results-button",
    "searchfield-results-decoration", "zoom"
  ], nonStandardPropertyKeywords = keySet(nonStandardPropertyKeywords_);

  var fontProperties_ = [
    "font-family", "src", "unicode-range", "font-variant", "font-feature-settings",
    "font-stretch", "font-weight", "font-style"
  ], fontProperties = keySet(fontProperties_);

  var counterDescriptors_ = [
    "additive-symbols", "fallback", "negative", "pad", "prefix", "range",
    "speak-as", "suffix", "symbols", "system"
  ], counterDescriptors = keySet(counterDescriptors_);

  var colorKeywords_ = [
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
    "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
    "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue",
    "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod",
    "darkgray", "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen",
    "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen",
    "darkslateblue", "darkslategray", "darkturquoise", "darkviolet",
    "deeppink", "deepskyblue", "dimgray", "dodgerblue", "firebrick",
    "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite",
    "gold", "goldenrod", "gray", "grey", "green", "greenyellow", "honeydew",
    "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
    "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral",
    "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink",
    "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
    "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta",
    "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple",
    "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise",
    "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
    "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered",
    "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
    "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue",
    "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown",
    "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue",
    "slateblue", "slategray", "snow", "springgreen", "steelblue", "tan",
    "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white",
    "whitesmoke", "yellow", "yellowgreen"
  ], colorKeywords = keySet(colorKeywords_);

  var valueKeywords_ = [
    "above", "absolute", "activeborder", "additive", "activecaption", "afar",
    "after-white-space", "ahead", "alias", "all", "all-scroll", "alphabetic", "alternate",
    "always", "amharic", "amharic-abegede", "antialiased", "appworkspace",
    "arabic-indic", "armenian", "asterisks", "attr", "auto", "auto-flow", "avoid", "avoid-column", "avoid-page",
    "avoid-region", "background", "backwards", "baseline", "below", "bidi-override", "binary",
    "bengali", "blink", "block", "block-axis", "bold", "bolder", "border", "border-box",
    "both", "bottom", "break", "break-all", "break-word", "bullets", "button", "button-bevel",
    "buttonface", "buttonhighlight", "buttonshadow", "buttontext", "calc", "cambodian",
    "capitalize", "caps-lock-indicator", "caption", "captiontext", "caret",
    "cell", "center", "checkbox", "circle", "cjk-decimal", "cjk-earthly-branch",
    "cjk-heavenly-stem", "cjk-ideographic", "clear", "clip", "close-quote",
    "col-resize", "collapse", "color", "color-burn", "color-dodge", "column", "column-reverse",
    "compact", "condensed", "contain", "content", "contents",
    "content-box", "context-menu", "continuous", "copy", "counter", "counters", "cover", "crop",
    "cross", "crosshair", "currentcolor", "cursive", "cyclic", "darken", "dashed", "decimal",
    "decimal-leading-zero", "default", "default-button", "dense", "destination-atop",
    "destination-in", "destination-out", "destination-over", "devanagari", "difference",
    "disc", "discard", "disclosure-closed", "disclosure-open", "document",
    "dot-dash", "dot-dot-dash",
    "dotted", "double", "down", "e-resize", "ease", "ease-in", "ease-in-out", "ease-out",
    "element", "ellipse", "ellipsis", "embed", "end", "ethiopic", "ethiopic-abegede",
    "ethiopic-abegede-am-et", "ethiopic-abegede-gez", "ethiopic-abegede-ti-er",
    "ethiopic-abegede-ti-et", "ethiopic-halehame-aa-er",
    "ethiopic-halehame-aa-et", "ethiopic-halehame-am-et",
    "ethiopic-halehame-gez", "ethiopic-halehame-om-et",
    "ethiopic-halehame-sid-et", "ethiopic-halehame-so-et",
    "ethiopic-halehame-ti-er", "ethiopic-halehame-ti-et", "ethiopic-halehame-tig",
    "ethiopic-numeric", "ew-resize", "exclusion", "expanded", "extends", "extra-condensed",
    "extra-expanded", "fantasy", "fast", "fill", "fixed", "flat", "flex", "flex-end", "flex-start", "footnotes",
    "forwards", "from", "geometricPrecision", "georgian", "graytext", "grid", "groove",
    "gujarati", "gurmukhi", "hand", "hangul", "hangul-consonant", "hard-light", "hebrew",
    "help", "hidden", "hide", "higher", "highlight", "highlighttext",
    "hiragana", "hiragana-iroha", "horizontal", "hsl", "hsla", "hue", "icon", "ignore",
    "inactiveborder", "inactivecaption", "inactivecaptiontext", "infinite",
    "infobackground", "infotext", "inherit", "initial", "inline", "inline-axis",
    "inline-block", "inline-flex", "inline-grid", "inline-table", "inset", "inside", "intrinsic", "invert",
    "italic", "japanese-formal", "japanese-informal", "justify", "kannada",
    "katakana", "katakana-iroha", "keep-all", "khmer",
    "korean-hangul-formal", "korean-hanja-formal", "korean-hanja-informal",
    "landscape", "lao", "large", "larger", "left", "level", "lighter", "lighten",
    "line-through", "linear", "linear-gradient", "lines", "list-item", "listbox", "listitem",
    "local", "logical", "loud", "lower", "lower-alpha", "lower-armenian",
    "lower-greek", "lower-hexadecimal", "lower-latin", "lower-norwegian",
    "lower-roman", "lowercase", "ltr", "luminosity", "malayalam", "match", "matrix", "matrix3d",
    "media-controls-background", "media-current-time-display",
    "media-fullscreen-button", "media-mute-button", "media-play-button",
    "media-return-to-realtime-button", "media-rewind-button",
    "media-seek-back-button", "media-seek-forward-button", "media-slider",
    "media-sliderthumb", "media-time-remaining-display", "media-volume-slider",
    "media-volume-slider-container", "media-volume-sliderthumb", "medium",
    "menu", "menulist", "menulist-button", "menulist-text",
    "menulist-textfield", "menutext", "message-box", "middle", "min-intrinsic",
    "mix", "mongolian", "monospace", "move", "multiple", "multiply", "myanmar", "n-resize",
    "narrower", "ne-resize", "nesw-resize", "no-close-quote", "no-drop",
    "no-open-quote", "no-repeat", "none", "normal", "not-allowed", "nowrap",
    "ns-resize", "numbers", "numeric", "nw-resize", "nwse-resize", "oblique", "octal", "opacity", "open-quote",
    "optimizeLegibility", "optimizeSpeed", "oriya", "oromo", "outset",
    "outside", "outside-shape", "overlay", "overline", "padding", "padding-box",
    "painted", "page", "paused", "persian", "perspective", "plus-darker", "plus-lighter",
    "pointer", "polygon", "portrait", "pre", "pre-line", "pre-wrap", "preserve-3d",
    "progress", "push-button", "radial-gradient", "radio", "read-only",
    "read-write", "read-write-plaintext-only", "rectangle", "region",
    "relative", "repeat", "repeating-linear-gradient",
    "repeating-radial-gradient", "repeat-x", "repeat-y", "reset", "reverse",
    "rgb", "rgba", "ridge", "right", "rotate", "rotate3d", "rotateX", "rotateY",
    "rotateZ", "round", "row", "row-resize", "row-reverse", "rtl", "run-in", "running",
    "s-resize", "sans-serif", "saturation", "scale", "scale3d", "scaleX", "scaleY", "scaleZ", "screen",
    "scroll", "scrollbar", "scroll-position", "se-resize", "searchfield",
    "searchfield-cancel-button", "searchfield-decoration",
    "searchfield-results-button", "searchfield-results-decoration", "self-start", "self-end",
    "semi-condensed", "semi-expanded", "separate", "serif", "show", "sidama",
    "simp-chinese-formal", "simp-chinese-informal", "single",
    "skew", "skewX", "skewY", "skip-white-space", "slide", "slider-horizontal",
    "slider-vertical", "sliderthumb-horizontal", "sliderthumb-vertical", "slow",
    "small", "small-caps", "small-caption", "smaller", "soft-light", "solid", "somali",
    "source-atop", "source-in", "source-out", "source-over", "space", "space-around", "space-between", "space-evenly", "spell-out", "square",
    "square-button", "start", "static", "status-bar", "stretch", "stroke", "sub",
    "subpixel-antialiased", "super", "sw-resize", "symbolic", "symbols", "system-ui", "table",
    "table-caption", "table-cell", "table-column", "table-column-group",
    "table-footer-group", "table-header-group", "table-row", "table-row-group",
    "tamil",
    "telugu", "text", "text-bottom", "text-top", "textarea", "textfield", "thai",
    "thick", "thin", "threeddarkshadow", "threedface", "threedhighlight",
    "threedlightshadow", "threedshadow", "tibetan", "tigre", "tigrinya-er",
    "tigrinya-er-abegede", "tigrinya-et", "tigrinya-et-abegede", "to", "top",
    "trad-chinese-formal", "trad-chinese-informal", "transform",
    "translate", "translate3d", "translateX", "translateY", "translateZ",
    "transparent", "ultra-condensed", "ultra-expanded", "underline", "unset", "up",
    "upper-alpha", "upper-armenian", "upper-greek", "upper-hexadecimal",
    "upper-latin", "upper-norwegian", "upper-roman", "uppercase", "urdu", "url",
    "var", "vertical", "vertical-text", "visible", "visibleFill", "visiblePainted",
    "visibleStroke", "visual", "w-resize", "wait", "wave", "wider",
    "window", "windowframe", "windowtext", "words", "wrap", "wrap-reverse", "x-large", "x-small", "xor",
    "xx-large", "xx-small"
  ], valueKeywords = keySet(valueKeywords_);

  var allWords = documentTypes_.concat(mediaTypes_).concat(mediaFeatures_).concat(mediaValueKeywords_)
    .concat(propertyKeywords_).concat(nonStandardPropertyKeywords_).concat(colorKeywords_)
    .concat(valueKeywords_);
  CodeMirror.registerHelper("hintWords", "css", allWords);

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ["comment", "comment"];
  }

  CodeMirror.defineMIME("text/css", {
    documentTypes: documentTypes,
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    mediaValueKeywords: mediaValueKeywords,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    fontProperties: fontProperties,
    counterDescriptors: counterDescriptors,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    tokenHooks: {
      "/": function(stream, state) {
        if (!stream.eat("*")) return false;
        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
      }
    },
    name: "css"
  });

  CodeMirror.defineMIME("text/x-scss", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    mediaValueKeywords: mediaValueKeywords,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    allowNested: true,
    lineComment: "//",
    tokenHooks: {
      "/": function(stream, state) {
        if (stream.eat("/")) {
          stream.skipToEnd();
          return ["comment", "comment"];
        } else if (stream.eat("*")) {
          state.tokenize = tokenCComment;
          return tokenCComment(stream, state);
        } else {
          return ["operator", "operator"];
        }
      },
      ":": function(stream) {
        if (stream.match(/\s*\{/, false))
          return [null, null]
        return false;
      },
      "$": function(stream) {
        stream.match(/^[\w-]+/);
        if (stream.match(/^\s*:/, false))
          return ["variable-2", "variable-definition"];
        return ["variable-2", "variable"];
      },
      "#": function(stream) {
        if (!stream.eat("{")) return false;
        return [null, "interpolation"];
      }
    },
    name: "css",
    helperType: "scss"
  });

  CodeMirror.defineMIME("text/x-less", {
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    mediaValueKeywords: mediaValueKeywords,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    fontProperties: fontProperties,
    allowNested: true,
    lineComment: "//",
    tokenHooks: {
      "/": function(stream, state) {
        if (stream.eat("/")) {
          stream.skipToEnd();
          return ["comment", "comment"];
        } else if (stream.eat("*")) {
          state.tokenize = tokenCComment;
          return tokenCComment(stream, state);
        } else {
          return ["operator", "operator"];
        }
      },
      "@": function(stream) {
        if (stream.eat("{")) return [null, "interpolation"];
        if (stream.match(/^(charset|document|font-face|import|(-(moz|ms|o|webkit)-)?keyframes|media|namespace|page|supports)\b/i, false)) return false;
        stream.eatWhile(/[\w\\\-]/);
        if (stream.match(/^\s*:/, false))
          return ["variable-2", "variable-definition"];
        return ["variable-2", "variable"];
      },
      "&": function() {
        return ["atom", "atom"];
      }
    },
    name: "css",
    helperType: "less"
  });

  CodeMirror.defineMIME("text/x-gss", {
    documentTypes: documentTypes,
    mediaTypes: mediaTypes,
    mediaFeatures: mediaFeatures,
    propertyKeywords: propertyKeywords,
    nonStandardPropertyKeywords: nonStandardPropertyKeywords,
    fontProperties: fontProperties,
    counterDescriptors: counterDescriptors,
    colorKeywords: colorKeywords,
    valueKeywords: valueKeywords,
    supportsAtComponent: true,
    tokenHooks: {
      "/": function(stream, state) {
        if (!stream.eat("*")) return false;
        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
      }
    },
    name: "css",
    helperType: "gss"
  });

});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE


define('skylark-codemirror/mode/htmlmixed/htmlmixed',[
  "../../CodeMirror",
  "../xml/xml",
  "../javascript/javascript",
  "../css/css"
], function(CodeMirror) {

  "use strict";

  var defaultTags = {
    script: [
      ["lang", /(javascript|babel)/i, "javascript"],
      ["type", /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i, "javascript"],
      ["type", /./, "text/plain"],
      [null, null, "javascript"]
    ],
    style:  [
      ["lang", /^css$/i, "css"],
      ["type", /^(text\/)?(x-)?(stylesheet|css)$/i, "css"],
      ["type", /./, "text/plain"],
      [null, null, "css"]
    ]
  };

  function maybeBackup(stream, pat, style) {
    var cur = stream.current(), close = cur.search(pat);
    if (close > -1) {
      stream.backUp(cur.length - close);
    } else if (cur.match(/<\/?$/)) {
      stream.backUp(cur.length);
      if (!stream.match(pat, false)) stream.match(cur);
    }
    return style;
  }

  var attrRegexpCache = {};
  function getAttrRegexp(attr) {
    var regexp = attrRegexpCache[attr];
    if (regexp) return regexp;
    return attrRegexpCache[attr] = new RegExp("\\s+" + attr + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*");
  }

  function getAttrValue(text, attr) {
    var match = text.match(getAttrRegexp(attr))
    return match ? /^\s*(.*?)\s*$/.exec(match[2])[1] : ""
  }

  function getTagRegexp(tagName, anchored) {
    return new RegExp((anchored ? "^" : "") + "<\/\s*" + tagName + "\s*>", "i");
  }

  function addTags(from, to) {
    for (var tag in from) {
      var dest = to[tag] || (to[tag] = []);
      var source = from[tag];
      for (var i = source.length - 1; i >= 0; i--)
        dest.unshift(source[i])
    }
  }

  function findMatchingMode(tagInfo, tagText) {
    for (var i = 0; i < tagInfo.length; i++) {
      var spec = tagInfo[i];
      if (!spec[0] || spec[1].test(getAttrValue(tagText, spec[0]))) return spec[2];
    }
  }

  CodeMirror.defineMode("htmlmixed", function (config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, {
      name: "xml",
      htmlMode: true,
      multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
      multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag
    });

    var tags = {};
    var configTags = parserConfig && parserConfig.tags, configScript = parserConfig && parserConfig.scriptTypes;
    addTags(defaultTags, tags);
    if (configTags) addTags(configTags, tags);
    if (configScript) for (var i = configScript.length - 1; i >= 0; i--)
      tags.script.unshift(["type", configScript[i].matches, configScript[i].mode])

    function html(stream, state) {
      var style = htmlMode.token(stream, state.htmlState), tag = /\btag\b/.test(style), tagName
      if (tag && !/[<>\s\/]/.test(stream.current()) &&
          (tagName = state.htmlState.tagName && state.htmlState.tagName.toLowerCase()) &&
          tags.hasOwnProperty(tagName)) {
        state.inTag = tagName + " "
      } else if (state.inTag && tag && />$/.test(stream.current())) {
        var inTag = /^([\S]+) (.*)/.exec(state.inTag)
        state.inTag = null
        var modeSpec = stream.current() == ">" && findMatchingMode(tags[inTag[1]], inTag[2])
        var mode = CodeMirror.getMode(config, modeSpec)
        var endTagA = getTagRegexp(inTag[1], true), endTag = getTagRegexp(inTag[1], false);
        state.token = function (stream, state) {
          if (stream.match(endTagA, false)) {
            state.token = html;
            state.localState = state.localMode = null;
            return null;
          }
          return maybeBackup(stream, endTag, state.localMode.token(stream, state.localState));
        };
        state.localMode = mode;
        state.localState = CodeMirror.startState(mode, htmlMode.indent(state.htmlState, "", ""));
      } else if (state.inTag) {
        state.inTag += stream.current()
        if (stream.eol()) state.inTag += " "
      }
      return style;
    };

    return {
      startState: function () {
        var state = CodeMirror.startState(htmlMode);
        return {token: html, inTag: null, localMode: null, localState: null, htmlState: state};
      },

      copyState: function (state) {
        var local;
        if (state.localState) {
          local = CodeMirror.copyState(state.localMode, state.localState);
        }
        return {token: state.token, inTag: state.inTag,
                localMode: state.localMode, localState: local,
                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
      },

      token: function (stream, state) {
        return state.token(stream, state);
      },

      indent: function (state, textAfter, line) {
        if (!state.localMode || /^\s*<\//.test(textAfter))
          return htmlMode.indent(state.htmlState, textAfter, line);
        else if (state.localMode.indent)
          return state.localMode.indent(state.localState, textAfter, line);
        else
          return CodeMirror.Pass;
      },

      innerMode: function (state) {
        return {state: state.localState || state.htmlState, mode: state.localMode || htmlMode};
      }
    };
  }, "xml", "javascript", "css");

  CodeMirror.defineMIME("text/html", "htmlmixed");
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/mode/jsx/jsx',["../../CodeMirror", "../xml/xml", "../javascript/javascript"], function(CodeMirror) {
  "use strict"

  // Depth means the amount of open braces in JS context, in XML
  // context 0 means not in tag, 1 means in tag, and 2 means in tag
  // and js block comment.
  function Context(state, mode, depth, prev) {
    this.state = state; this.mode = mode; this.depth = depth; this.prev = prev
  }

  function copyContext(context) {
    return new Context(CodeMirror.copyState(context.mode, context.state),
                       context.mode,
                       context.depth,
                       context.prev && copyContext(context.prev))
  }

  CodeMirror.defineMode("jsx", function(config, modeConfig) {
    var xmlMode = CodeMirror.getMode(config, {name: "xml", allowMissing: true, multilineTagIndentPastTag: false, allowMissingTagName: true})
    var jsMode = CodeMirror.getMode(config, modeConfig && modeConfig.base || "javascript")

    function flatXMLIndent(state) {
      var tagName = state.tagName
      state.tagName = null
      var result = xmlMode.indent(state, "", "")
      state.tagName = tagName
      return result
    }

    function token(stream, state) {
      if (state.context.mode == xmlMode)
        return xmlToken(stream, state, state.context)
      else
        return jsToken(stream, state, state.context)
    }

    function xmlToken(stream, state, cx) {
      if (cx.depth == 2) { // Inside a JS /* */ comment
        if (stream.match(/^.*?\*\//)) cx.depth = 1
        else stream.skipToEnd()
        return "comment"
      }

      if (stream.peek() == "{") {
        xmlMode.skipAttribute(cx.state)

        var indent = flatXMLIndent(cx.state), xmlContext = cx.state.context
        // If JS starts on same line as tag
        if (xmlContext && stream.match(/^[^>]*>\s*$/, false)) {
          while (xmlContext.prev && !xmlContext.startOfLine)
            xmlContext = xmlContext.prev
          // If tag starts the line, use XML indentation level
          if (xmlContext.startOfLine) indent -= config.indentUnit
          // Else use JS indentation level
          else if (cx.prev.state.lexical) indent = cx.prev.state.lexical.indented
        // Else if inside of tag
        } else if (cx.depth == 1) {
          indent += config.indentUnit
        }

        state.context = new Context(CodeMirror.startState(jsMode, indent),
                                    jsMode, 0, state.context)
        return null
      }

      if (cx.depth == 1) { // Inside of tag
        if (stream.peek() == "<") { // Tag inside of tag
          xmlMode.skipAttribute(cx.state)
          state.context = new Context(CodeMirror.startState(xmlMode, flatXMLIndent(cx.state)),
                                      xmlMode, 0, state.context)
          return null
        } else if (stream.match("//")) {
          stream.skipToEnd()
          return "comment"
        } else if (stream.match("/*")) {
          cx.depth = 2
          return token(stream, state)
        }
      }

      var style = xmlMode.token(stream, cx.state), cur = stream.current(), stop
      if (/\btag\b/.test(style)) {
        if (/>$/.test(cur)) {
          if (cx.state.context) cx.depth = 0
          else state.context = state.context.prev
        } else if (/^</.test(cur)) {
          cx.depth = 1
        }
      } else if (!style && (stop = cur.indexOf("{")) > -1) {
        stream.backUp(cur.length - stop)
      }
      return style
    }

    function jsToken(stream, state, cx) {
      if (stream.peek() == "<" && jsMode.expressionAllowed(stream, cx.state)) {
        jsMode.skipExpression(cx.state)
        state.context = new Context(CodeMirror.startState(xmlMode, jsMode.indent(cx.state, "", "")),
                                    xmlMode, 0, state.context)
        return null
      }

      var style = jsMode.token(stream, cx.state)
      if (!style && cx.depth != null) {
        var cur = stream.current()
        if (cur == "{") {
          cx.depth++
        } else if (cur == "}") {
          if (--cx.depth == 0) state.context = state.context.prev
        }
      }
      return style
    }

    return {
      startState: function() {
        return {context: new Context(CodeMirror.startState(jsMode), jsMode)}
      },

      copyState: function(state) {
        return {context: copyContext(state.context)}
      },

      token: token,

      indent: function(state, textAfter, fullLine) {
        return state.context.mode.indent(state.context.state, textAfter, fullLine)
      },

      innerMode: function(state) {
        return state.context
      }
    }
  }, "xml", "javascript")

  CodeMirror.defineMIME("text/jsx", "jsx")
  CodeMirror.defineMIME("text/typescript-jsx", {name: "jsx", base: {name: "javascript", typescript: true}})
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/addon/scroll/simplescrollbars',["../../CodeMirror"], function(CodeMirror) {
  "use strict";

  function Bar(cls, orientation, scroll) {
    this.orientation = orientation;
    this.scroll = scroll;
    this.screen = this.total = this.size = 1;
    this.pos = 0;

    this.node = document.createElement("div");
    this.node.className = cls + "-" + orientation;
    this.inner = this.node.appendChild(document.createElement("div"));

    var self = this;
    CodeMirror.on(this.inner, "mousedown", function(e) {
      if (e.which != 1) return;
      CodeMirror.e_preventDefault(e);
      var axis = self.orientation == "horizontal" ? "pageX" : "pageY";
      var start = e[axis], startpos = self.pos;
      function done() {
        CodeMirror.off(document, "mousemove", move);
        CodeMirror.off(document, "mouseup", done);
      }
      function move(e) {
        if (e.which != 1) return done();
        self.moveTo(startpos + (e[axis] - start) * (self.total / self.size));
      }
      CodeMirror.on(document, "mousemove", move);
      CodeMirror.on(document, "mouseup", done);
    });

    CodeMirror.on(this.node, "click", function(e) {
      CodeMirror.e_preventDefault(e);
      var innerBox = self.inner.getBoundingClientRect(), where;
      if (self.orientation == "horizontal")
        where = e.clientX < innerBox.left ? -1 : e.clientX > innerBox.right ? 1 : 0;
      else
        where = e.clientY < innerBox.top ? -1 : e.clientY > innerBox.bottom ? 1 : 0;
      self.moveTo(self.pos + where * self.screen);
    });

    function onWheel(e) {
      var moved = CodeMirror.wheelEventPixels(e)[self.orientation == "horizontal" ? "x" : "y"];
      var oldPos = self.pos;
      self.moveTo(self.pos + moved);
      if (self.pos != oldPos) CodeMirror.e_preventDefault(e);
    }
    CodeMirror.on(this.node, "mousewheel", onWheel);
    CodeMirror.on(this.node, "DOMMouseScroll", onWheel);
  }

  Bar.prototype.setPos = function(pos, force) {
    if (pos < 0) pos = 0;
    if (pos > this.total - this.screen) pos = this.total - this.screen;
    if (!force && pos == this.pos) return false;
    this.pos = pos;
    this.inner.style[this.orientation == "horizontal" ? "left" : "top"] =
      (pos * (this.size / this.total)) + "px";
    return true
  };

  Bar.prototype.moveTo = function(pos) {
    if (this.setPos(pos)) this.scroll(pos, this.orientation);
  }

  var minButtonSize = 10;

  Bar.prototype.update = function(scrollSize, clientSize, barSize) {
    var sizeChanged = this.screen != clientSize || this.total != scrollSize || this.size != barSize
    if (sizeChanged) {
      this.screen = clientSize;
      this.total = scrollSize;
      this.size = barSize;
    }

    var buttonSize = this.screen * (this.size / this.total);
    if (buttonSize < minButtonSize) {
      this.size -= minButtonSize - buttonSize;
      buttonSize = minButtonSize;
    }
    this.inner.style[this.orientation == "horizontal" ? "width" : "height"] =
      buttonSize + "px";
    this.setPos(this.pos, sizeChanged);
  };

  function SimpleScrollbars(cls, place, scroll) {
    this.addClass = cls;
    this.horiz = new Bar(cls, "horizontal", scroll);
    place(this.horiz.node);
    this.vert = new Bar(cls, "vertical", scroll);
    place(this.vert.node);
    this.width = null;
  }

  SimpleScrollbars.prototype.update = function(measure) {
    if (this.width == null) {
      var style = window.getComputedStyle ? window.getComputedStyle(this.horiz.node) : this.horiz.node.currentStyle;
      if (style) this.width = parseInt(style.height);
    }
    var width = this.width || 0;

    var needsH = measure.scrollWidth > measure.clientWidth + 1;
    var needsV = measure.scrollHeight > measure.clientHeight + 1;
    this.vert.node.style.display = needsV ? "block" : "none";
    this.horiz.node.style.display = needsH ? "block" : "none";

    if (needsV) {
      this.vert.update(measure.scrollHeight, measure.clientHeight,
                       measure.viewHeight - (needsH ? width : 0));
      this.vert.node.style.bottom = needsH ? width + "px" : "0";
    }
    if (needsH) {
      this.horiz.update(measure.scrollWidth, measure.clientWidth,
                        measure.viewWidth - (needsV ? width : 0) - measure.barLeft);
      this.horiz.node.style.right = needsV ? width + "px" : "0";
      this.horiz.node.style.left = measure.barLeft + "px";
    }

    return {right: needsV ? width : 0, bottom: needsH ? width : 0};
  };

  SimpleScrollbars.prototype.setScrollTop = function(pos) {
    this.vert.setPos(pos);
  };

  SimpleScrollbars.prototype.setScrollLeft = function(pos) {
    this.horiz.setPos(pos);
  };

  SimpleScrollbars.prototype.clear = function() {
    var parent = this.horiz.node.parentNode;
    parent.removeChild(this.horiz.node);
    parent.removeChild(this.vert.node);
  };

  CodeMirror.scrollbarModel.simple = function(place, scroll) {
    return new SimpleScrollbars("CodeMirror-simplescroll", place, scroll);
  };
  CodeMirror.scrollbarModel.overlay = function(place, scroll) {
    return new SimpleScrollbars("CodeMirror-overlayscroll", place, scroll);
  };
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/addon/edit/matchbrackets',["../../CodeMirror"], function(CodeMirror) {
  var ie_lt8 = /MSIE \d/.test(navigator.userAgent) &&
    (document.documentMode == null || document.documentMode < 8);

  var Pos = CodeMirror.Pos;

  var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<", "<": ">>", ">": "<<"};

  function bracketRegex(config) {
    return config && config.bracketRegex || /[(){}[\]]/
  }

  function findMatchingBracket(cm, where, config) {
    var line = cm.getLineHandle(where.line), pos = where.ch - 1;
    var afterCursor = config && config.afterCursor
    if (afterCursor == null)
      afterCursor = /(^| )cm-fat-cursor($| )/.test(cm.getWrapperElement().className)
    var re = bracketRegex(config)

    // A cursor is defined as between two characters, but in in vim command mode
    // (i.e. not insert mode), the cursor is visually represented as a
    // highlighted box on top of the 2nd character. Otherwise, we allow matches
    // from before or after the cursor.
    var match = (!afterCursor && pos >= 0 && re.test(line.text.charAt(pos)) && matching[line.text.charAt(pos)]) ||
        re.test(line.text.charAt(pos + 1)) && matching[line.text.charAt(++pos)];
    if (!match) return null;
    var dir = match.charAt(1) == ">" ? 1 : -1;
    if (config && config.strict && (dir > 0) != (pos == where.ch)) return null;
    var style = cm.getTokenTypeAt(Pos(where.line, pos + 1));

    var found = scanForBracket(cm, Pos(where.line, pos + (dir > 0 ? 1 : 0)), dir, style || null, config);
    if (found == null) return null;
    return {from: Pos(where.line, pos), to: found && found.pos,
            match: found && found.ch == match.charAt(0), forward: dir > 0};
  }

  // bracketRegex is used to specify which type of bracket to scan
  // should be a regexp, e.g. /[[\]]/
  //
  // Note: If "where" is on an open bracket, then this bracket is ignored.
  //
  // Returns false when no bracket was found, null when it reached
  // maxScanLines and gave up
  function scanForBracket(cm, where, dir, style, config) {
    var maxScanLen = (config && config.maxScanLineLength) || 10000;
    var maxScanLines = (config && config.maxScanLines) || 1000;

    var stack = [];
    var re = bracketRegex(config)
    var lineEnd = dir > 0 ? Math.min(where.line + maxScanLines, cm.lastLine() + 1)
                          : Math.max(cm.firstLine() - 1, where.line - maxScanLines);
    for (var lineNo = where.line; lineNo != lineEnd; lineNo += dir) {
      var line = cm.getLine(lineNo);
      if (!line) continue;
      var pos = dir > 0 ? 0 : line.length - 1, end = dir > 0 ? line.length : -1;
      if (line.length > maxScanLen) continue;
      if (lineNo == where.line) pos = where.ch - (dir < 0 ? 1 : 0);
      for (; pos != end; pos += dir) {
        var ch = line.charAt(pos);
        if (re.test(ch) && (style === undefined || cm.getTokenTypeAt(Pos(lineNo, pos + 1)) == style)) {
          var match = matching[ch];
          if (match && (match.charAt(1) == ">") == (dir > 0)) stack.push(ch);
          else if (!stack.length) return {pos: Pos(lineNo, pos), ch: ch};
          else stack.pop();
        }
      }
    }
    return lineNo - dir == (dir > 0 ? cm.lastLine() : cm.firstLine()) ? false : null;
  }

  function matchBrackets(cm, autoclear, config) {
    // Disable brace matching in long lines, since it'll cause hugely slow updates
    var maxHighlightLen = cm.state.matchBrackets.maxHighlightLineLength || 1000;
    var marks = [], ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      var match = ranges[i].empty() && findMatchingBracket(cm, ranges[i].head, config);
      if (match && cm.getLine(match.from.line).length <= maxHighlightLen) {
        var style = match.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
        marks.push(cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), {className: style}));
        if (match.to && cm.getLine(match.to.line).length <= maxHighlightLen)
          marks.push(cm.markText(match.to, Pos(match.to.line, match.to.ch + 1), {className: style}));
      }
    }

    if (marks.length) {
      // Kludge to work around the IE bug from issue #1193, where text
      // input stops going to the textare whever this fires.
      if (ie_lt8 && cm.state.focused) cm.focus();

      var clear = function() {
        cm.operation(function() {
          for (var i = 0; i < marks.length; i++) marks[i].clear();
        });
      };
      if (autoclear) setTimeout(clear, 800);
      else return clear;
    }
  }

  function doMatchBrackets(cm) {
    cm.operation(function() {
      if (cm.state.matchBrackets.currentlyHighlighted) {
        cm.state.matchBrackets.currentlyHighlighted();
        cm.state.matchBrackets.currentlyHighlighted = null;
      }
      cm.state.matchBrackets.currentlyHighlighted = matchBrackets(cm, false, cm.state.matchBrackets);
    });
  }

  CodeMirror.defineOption("matchBrackets", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.off("cursorActivity", doMatchBrackets);
      if (cm.state.matchBrackets && cm.state.matchBrackets.currentlyHighlighted) {
        cm.state.matchBrackets.currentlyHighlighted();
        cm.state.matchBrackets.currentlyHighlighted = null;
      }
    }
    if (val) {
      cm.state.matchBrackets = typeof val == "object" ? val : {};
      cm.on("cursorActivity", doMatchBrackets);
    }
  });

  CodeMirror.defineExtension("matchBrackets", function() {matchBrackets(this, true);});
  CodeMirror.defineExtension("findMatchingBracket", function(pos, config, oldConfig){
    // Backwards-compatibility kludge
    if (oldConfig || typeof config == "boolean") {
      if (!oldConfig) {
        config = config ? {strict: true} : null
      } else {
        oldConfig.strict = config
        config = oldConfig
      }
    }
    return findMatchingBracket(this, pos, config)
  });
  CodeMirror.defineExtension("scanForBracket", function(pos, dir, style, config){
    return scanForBracket(this, pos, dir, style, config);
  });
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/addon/fold/xml-fold',["../../CodeMirror"], function(CodeMirror) {
  "use strict";

  var Pos = CodeMirror.Pos;
  function cmp(a, b) { return a.line - b.line || a.ch - b.ch; }

  var nameStartChar = "A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  var nameChar = nameStartChar + "\-\:\.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  var xmlTagStart = new RegExp("<(/?)([" + nameStartChar + "][" + nameChar + "]*)", "g");

  function Iter(cm, line, ch, range) {
    this.line = line; this.ch = ch;
    this.cm = cm; this.text = cm.getLine(line);
    this.min = range ? Math.max(range.from, cm.firstLine()) : cm.firstLine();
    this.max = range ? Math.min(range.to - 1, cm.lastLine()) : cm.lastLine();
  }

  function tagAt(iter, ch) {
    var type = iter.cm.getTokenTypeAt(Pos(iter.line, ch));
    return type && /\btag\b/.test(type);
  }

  function nextLine(iter) {
    if (iter.line >= iter.max) return;
    iter.ch = 0;
    iter.text = iter.cm.getLine(++iter.line);
    return true;
  }
  function prevLine(iter) {
    if (iter.line <= iter.min) return;
    iter.text = iter.cm.getLine(--iter.line);
    iter.ch = iter.text.length;
    return true;
  }

  function toTagEnd(iter) {
    for (;;) {
      var gt = iter.text.indexOf(">", iter.ch);
      if (gt == -1) { if (nextLine(iter)) continue; else return; }
      if (!tagAt(iter, gt + 1)) { iter.ch = gt + 1; continue; }
      var lastSlash = iter.text.lastIndexOf("/", gt);
      var selfClose = lastSlash > -1 && !/\S/.test(iter.text.slice(lastSlash + 1, gt));
      iter.ch = gt + 1;
      return selfClose ? "selfClose" : "regular";
    }
  }
  function toTagStart(iter) {
    for (;;) {
      var lt = iter.ch ? iter.text.lastIndexOf("<", iter.ch - 1) : -1;
      if (lt == -1) { if (prevLine(iter)) continue; else return; }
      if (!tagAt(iter, lt + 1)) { iter.ch = lt; continue; }
      xmlTagStart.lastIndex = lt;
      iter.ch = lt;
      var match = xmlTagStart.exec(iter.text);
      if (match && match.index == lt) return match;
    }
  }

  function toNextTag(iter) {
    for (;;) {
      xmlTagStart.lastIndex = iter.ch;
      var found = xmlTagStart.exec(iter.text);
      if (!found) { if (nextLine(iter)) continue; else return; }
      if (!tagAt(iter, found.index + 1)) { iter.ch = found.index + 1; continue; }
      iter.ch = found.index + found[0].length;
      return found;
    }
  }
  function toPrevTag(iter) {
    for (;;) {
      var gt = iter.ch ? iter.text.lastIndexOf(">", iter.ch - 1) : -1;
      if (gt == -1) { if (prevLine(iter)) continue; else return; }
      if (!tagAt(iter, gt + 1)) { iter.ch = gt; continue; }
      var lastSlash = iter.text.lastIndexOf("/", gt);
      var selfClose = lastSlash > -1 && !/\S/.test(iter.text.slice(lastSlash + 1, gt));
      iter.ch = gt + 1;
      return selfClose ? "selfClose" : "regular";
    }
  }

  function findMatchingClose(iter, tag) {
    var stack = [];
    for (;;) {
      var next = toNextTag(iter), end, startLine = iter.line, startCh = iter.ch - (next ? next[0].length : 0);
      if (!next || !(end = toTagEnd(iter))) return;
      if (end == "selfClose") continue;
      if (next[1]) { // closing tag
        for (var i = stack.length - 1; i >= 0; --i) if (stack[i] == next[2]) {
          stack.length = i;
          break;
        }
        if (i < 0 && (!tag || tag == next[2])) return {
          tag: next[2],
          from: Pos(startLine, startCh),
          to: Pos(iter.line, iter.ch)
        };
      } else { // opening tag
        stack.push(next[2]);
      }
    }
  }
  function findMatchingOpen(iter, tag) {
    var stack = [];
    for (;;) {
      var prev = toPrevTag(iter);
      if (!prev) return;
      if (prev == "selfClose") { toTagStart(iter); continue; }
      var endLine = iter.line, endCh = iter.ch;
      var start = toTagStart(iter);
      if (!start) return;
      if (start[1]) { // closing tag
        stack.push(start[2]);
      } else { // opening tag
        for (var i = stack.length - 1; i >= 0; --i) if (stack[i] == start[2]) {
          stack.length = i;
          break;
        }
        if (i < 0 && (!tag || tag == start[2])) return {
          tag: start[2],
          from: Pos(iter.line, iter.ch),
          to: Pos(endLine, endCh)
        };
      }
    }
  }

  CodeMirror.registerHelper("fold", "xml", function(cm, start) {
    var iter = new Iter(cm, start.line, 0);
    for (;;) {
      var openTag = toNextTag(iter)
      if (!openTag || iter.line != start.line) return
      var end = toTagEnd(iter)
      if (!end) return
      if (!openTag[1] && end != "selfClose") {
        var startPos = Pos(iter.line, iter.ch);
        var endPos = findMatchingClose(iter, openTag[2]);
        return endPos && cmp(endPos.from, startPos) > 0 ? {from: startPos, to: endPos.from} : null
      }
    }
  });
  CodeMirror.findMatchingTag = function(cm, pos, range) {
    var iter = new Iter(cm, pos.line, pos.ch, range);
    if (iter.text.indexOf(">") == -1 && iter.text.indexOf("<") == -1) return;
    var end = toTagEnd(iter), to = end && Pos(iter.line, iter.ch);
    var start = end && toTagStart(iter);
    if (!end || !start || cmp(iter, pos) > 0) return;
    var here = {from: Pos(iter.line, iter.ch), to: to, tag: start[2]};
    if (end == "selfClose") return {open: here, close: null, at: "open"};

    if (start[1]) { // closing tag
      return {open: findMatchingOpen(iter, start[2]), close: here, at: "close"};
    } else { // opening tag
      iter = new Iter(cm, to.line, to.ch, range);
      return {open: here, close: findMatchingClose(iter, start[2]), at: "open"};
    }
  };

  CodeMirror.findEnclosingTag = function(cm, pos, range, tag) {
    var iter = new Iter(cm, pos.line, pos.ch, range);
    for (;;) {
      var open = findMatchingOpen(iter, tag);
      if (!open) break;
      var forward = new Iter(cm, pos.line, pos.ch, range);
      var close = findMatchingClose(forward, open.tag);
      if (close) return {open: open, close: close};
    }
  };

  // Used by addon/edit/closetag.js
  CodeMirror.scanForClosingTag = function(cm, pos, name, end) {
    var iter = new Iter(cm, pos.line, pos.ch, end ? {from: 0, to: end} : null);
    return findMatchingClose(iter, name);
  };
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Tag-closer extension for CodeMirror.
 *
 * This extension adds an "autoCloseTags" option that can be set to
 * either true to get the default behavior, or an object to further
 * configure its behavior.
 *
 * These are supported options:
 *
 * `whenClosing` (default true)
 *   Whether to autoclose when the '/' of a closing tag is typed.
 * `whenOpening` (default true)
 *   Whether to autoclose the tag when the final '>' of an opening
 *   tag is typed.
 * `dontCloseTags` (default is empty tags for HTML, none for XML)
 *   An array of tag names that should not be autoclosed.
 * `indentTags` (default is block tags for HTML, none for XML)
 *   An array of tag names that should, when opened, cause a
 *   blank line to be added inside the tag, and the blank line and
 *   closing line to be indented.
 *
 * See demos/closetag.html for a usage example.
 */

define('skylark-codemirror/addon/edit/closetag',["../../CodeMirror", "../fold/xml-fold"],function(CodeMirror) {
  CodeMirror.defineOption("autoCloseTags", false, function(cm, val, old) {
    if (old != CodeMirror.Init && old)
      cm.removeKeyMap("autoCloseTags");
    if (!val) return;
    var map = {name: "autoCloseTags"};
    if (typeof val != "object" || val.whenClosing)
      map["'/'"] = function(cm) { return autoCloseSlash(cm); };
    if (typeof val != "object" || val.whenOpening)
      map["'>'"] = function(cm) { return autoCloseGT(cm); };
    cm.addKeyMap(map);
  });

  var htmlDontClose = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param",
                       "source", "track", "wbr"];
  var htmlIndent = ["applet", "blockquote", "body", "button", "div", "dl", "fieldset", "form", "frameset", "h1", "h2", "h3", "h4",
                    "h5", "h6", "head", "html", "iframe", "layer", "legend", "object", "ol", "p", "select", "table", "ul"];

  function autoCloseGT(cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    var ranges = cm.listSelections(), replacements = [];
    var opt = cm.getOption("autoCloseTags");
    for (var i = 0; i < ranges.length; i++) {
      if (!ranges[i].empty()) return CodeMirror.Pass;
      var pos = ranges[i].head, tok = cm.getTokenAt(pos);
      var inner = CodeMirror.innerMode(cm.getMode(), tok.state), state = inner.state;
      if (inner.mode.name != "xml" || !state.tagName) return CodeMirror.Pass;

      var html = inner.mode.configuration == "html";
      var dontCloseTags = (typeof opt == "object" && opt.dontCloseTags) || (html && htmlDontClose);
      var indentTags = (typeof opt == "object" && opt.indentTags) || (html && htmlIndent);

      var tagName = state.tagName;
      if (tok.end > pos.ch) tagName = tagName.slice(0, tagName.length - tok.end + pos.ch);
      var lowerTagName = tagName.toLowerCase();
      // Don't process the '>' at the end of an end-tag or self-closing tag
      if (!tagName ||
          tok.type == "string" && (tok.end != pos.ch || !/[\"\']/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1) ||
          tok.type == "tag" && state.type == "closeTag" ||
          tok.string.indexOf("/") == (tok.string.length - 1) || // match something like <someTagName />
          dontCloseTags && indexOf(dontCloseTags, lowerTagName) > -1 ||
          closingTagExists(cm, tagName, pos, state, true))
        return CodeMirror.Pass;

      var indent = indentTags && indexOf(indentTags, lowerTagName) > -1;
      replacements[i] = {indent: indent,
                         text: ">" + (indent ? "\n\n" : "") + "</" + tagName + ">",
                         newPos: indent ? CodeMirror.Pos(pos.line + 1, 0) : CodeMirror.Pos(pos.line, pos.ch + 1)};
    }

    var dontIndentOnAutoClose = (typeof opt == "object" && opt.dontIndentOnAutoClose);
    for (var i = ranges.length - 1; i >= 0; i--) {
      var info = replacements[i];
      cm.replaceRange(info.text, ranges[i].head, ranges[i].anchor, "+insert");
      var sel = cm.listSelections().slice(0);
      sel[i] = {head: info.newPos, anchor: info.newPos};
      cm.setSelections(sel);
      if (!dontIndentOnAutoClose && info.indent) {
        cm.indentLine(info.newPos.line, null, true);
        cm.indentLine(info.newPos.line + 1, null, true);
      }
    }
  }

  function autoCloseCurrent(cm, typingSlash) {
    var ranges = cm.listSelections(), replacements = [];
    var head = typingSlash ? "/" : "</";
    var opt = cm.getOption("autoCloseTags");
    var dontIndentOnAutoClose = (typeof opt == "object" && opt.dontIndentOnSlash);
    for (var i = 0; i < ranges.length; i++) {
      if (!ranges[i].empty()) return CodeMirror.Pass;
      var pos = ranges[i].head, tok = cm.getTokenAt(pos);
      var inner = CodeMirror.innerMode(cm.getMode(), tok.state), state = inner.state;
      if (typingSlash && (tok.type == "string" || tok.string.charAt(0) != "<" ||
                          tok.start != pos.ch - 1))
        return CodeMirror.Pass;
      // Kludge to get around the fact that we are not in XML mode
      // when completing in JS/CSS snippet in htmlmixed mode. Does not
      // work for other XML embedded languages (there is no general
      // way to go from a mixed mode to its current XML state).
      var replacement;
      if (inner.mode.name != "xml") {
        if (cm.getMode().name == "htmlmixed" && inner.mode.name == "javascript")
          replacement = head + "script";
        else if (cm.getMode().name == "htmlmixed" && inner.mode.name == "css")
          replacement = head + "style";
        else
          return CodeMirror.Pass;
      } else {
        if (!state.context || !state.context.tagName ||
            closingTagExists(cm, state.context.tagName, pos, state))
          return CodeMirror.Pass;
        replacement = head + state.context.tagName;
      }
      if (cm.getLine(pos.line).charAt(tok.end) != ">") replacement += ">";
      replacements[i] = replacement;
    }
    cm.replaceSelections(replacements);
    ranges = cm.listSelections();
    if (!dontIndentOnAutoClose) {
        for (var i = 0; i < ranges.length; i++)
            if (i == ranges.length - 1 || ranges[i].head.line < ranges[i + 1].head.line)
                cm.indentLine(ranges[i].head.line);
    }
  }

  function autoCloseSlash(cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    return autoCloseCurrent(cm, true);
  }

  CodeMirror.commands.closeTag = function(cm) { return autoCloseCurrent(cm); };

  function indexOf(collection, elt) {
    if (collection.indexOf) return collection.indexOf(elt);
    for (var i = 0, e = collection.length; i < e; ++i)
      if (collection[i] == elt) return i;
    return -1;
  }

  // If xml-fold is loaded, we use its functionality to try and verify
  // whether a given tag is actually unclosed.
  function closingTagExists(cm, tagName, pos, state, newTag) {
    if (!CodeMirror.scanForClosingTag) return false;
    var end = Math.min(cm.lastLine() + 1, pos.line + 500);
    var nextClose = CodeMirror.scanForClosingTag(cm, pos, null, end);
    if (!nextClose || nextClose.tag != tagName) return false;
    var cx = state.context;
    // If the immediate wrapping context contains onCx instances of
    // the same tag, a closing tag only exists if there are at least
    // that many closing tags of that type following.
    for (var onCx = newTag ? 1 : 0; cx && cx.tagName == tagName; cx = cx.prev) ++onCx;
    pos = nextClose.to;
    for (var i = 1; i < onCx; i++) {
      var next = CodeMirror.scanForClosingTag(cm, pos, null, end);
      if (!next || next.tag != tagName) return false;
      pos = next.to;
    }
    return true;
  }
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

define('skylark-codemirror/addon/edit/closebrackets',["../../CodeMirror"], function(CodeMirror) {
  var defaults = {
    pairs: "()[]{}''\"\"",
    closeBefore: ")]}'\":;>",
    triples: "",
    explode: "[]{}"
  };

  var Pos = CodeMirror.Pos;

  CodeMirror.defineOption("autoCloseBrackets", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.removeKeyMap(keyMap);
      cm.state.closeBrackets = null;
    }
    if (val) {
      ensureBound(getOption(val, "pairs"))
      cm.state.closeBrackets = val;
      cm.addKeyMap(keyMap);
    }
  });

  function getOption(conf, name) {
    if (name == "pairs" && typeof conf == "string") return conf;
    if (typeof conf == "object" && conf[name] != null) return conf[name];
    return defaults[name];
  }

  var keyMap = {Backspace: handleBackspace, Enter: handleEnter};
  function ensureBound(chars) {
    for (var i = 0; i < chars.length; i++) {
      var ch = chars.charAt(i), key = "'" + ch + "'"
      if (!keyMap[key]) keyMap[key] = handler(ch)
    }
  }
  ensureBound(defaults.pairs + "`")

  function handler(ch) {
    return function(cm) { return handleChar(cm, ch); };
  }

  function getConfig(cm) {
    var deflt = cm.state.closeBrackets;
    if (!deflt || deflt.override) return deflt;
    var mode = cm.getModeAt(cm.getCursor());
    return mode.closeBrackets || deflt;
  }

  function handleBackspace(cm) {
    var conf = getConfig(cm);
    if (!conf || cm.getOption("disableInput")) return CodeMirror.Pass;

    var pairs = getOption(conf, "pairs");
    var ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      if (!ranges[i].empty()) return CodeMirror.Pass;
      var around = charsAround(cm, ranges[i].head);
      if (!around || pairs.indexOf(around) % 2 != 0) return CodeMirror.Pass;
    }
    for (var i = ranges.length - 1; i >= 0; i--) {
      var cur = ranges[i].head;
      cm.replaceRange("", Pos(cur.line, cur.ch - 1), Pos(cur.line, cur.ch + 1), "+delete");
    }
  }

  function handleEnter(cm) {
    var conf = getConfig(cm);
    var explode = conf && getOption(conf, "explode");
    if (!explode || cm.getOption("disableInput")) return CodeMirror.Pass;

    var ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      if (!ranges[i].empty()) return CodeMirror.Pass;
      var around = charsAround(cm, ranges[i].head);
      if (!around || explode.indexOf(around) % 2 != 0) return CodeMirror.Pass;
    }
    cm.operation(function() {
      var linesep = cm.lineSeparator() || "\n";
      cm.replaceSelection(linesep + linesep, null);
      cm.execCommand("goCharLeft");
      ranges = cm.listSelections();
      for (var i = 0; i < ranges.length; i++) {
        var line = ranges[i].head.line;
        cm.indentLine(line, null, true);
        cm.indentLine(line + 1, null, true);
      }
    });
  }

  function contractSelection(sel) {
    var inverted = CodeMirror.cmpPos(sel.anchor, sel.head) > 0;
    return {anchor: new Pos(sel.anchor.line, sel.anchor.ch + (inverted ? -1 : 1)),
            head: new Pos(sel.head.line, sel.head.ch + (inverted ? 1 : -1))};
  }

  function handleChar(cm, ch) {
    var conf = getConfig(cm);
    if (!conf || cm.getOption("disableInput")) return CodeMirror.Pass;

    var pairs = getOption(conf, "pairs");
    var pos = pairs.indexOf(ch);
    if (pos == -1) return CodeMirror.Pass;

    var closeBefore = getOption(conf,"closeBefore");

    var triples = getOption(conf, "triples");

    var identical = pairs.charAt(pos + 1) == ch;
    var ranges = cm.listSelections();
    var opening = pos % 2 == 0;

    var type;
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i], cur = range.head, curType;
      var next = cm.getRange(cur, Pos(cur.line, cur.ch + 1));
      if (opening && !range.empty()) {
        curType = "surround";
      } else if ((identical || !opening) && next == ch) {
        if (identical && stringStartsAfter(cm, cur))
          curType = "both";
        else if (triples.indexOf(ch) >= 0 && cm.getRange(cur, Pos(cur.line, cur.ch + 3)) == ch + ch + ch)
          curType = "skipThree";
        else
          curType = "skip";
      } else if (identical && cur.ch > 1 && triples.indexOf(ch) >= 0 &&
                 cm.getRange(Pos(cur.line, cur.ch - 2), cur) == ch + ch) {
        if (cur.ch > 2 && /\bstring/.test(cm.getTokenTypeAt(Pos(cur.line, cur.ch - 2)))) return CodeMirror.Pass;
        curType = "addFour";
      } else if (identical) {
        var prev = cur.ch == 0 ? " " : cm.getRange(Pos(cur.line, cur.ch - 1), cur)
        if (!CodeMirror.isWordChar(next) && prev != ch && !CodeMirror.isWordChar(prev)) curType = "both";
        else return CodeMirror.Pass;
      } else if (opening && (next.length === 0 || /\s/.test(next) || closeBefore.indexOf(next) > -1)) {
        curType = "both";
      } else {
        return CodeMirror.Pass;
      }
      if (!type) type = curType;
      else if (type != curType) return CodeMirror.Pass;
    }

    var left = pos % 2 ? pairs.charAt(pos - 1) : ch;
    var right = pos % 2 ? ch : pairs.charAt(pos + 1);
    cm.operation(function() {
      if (type == "skip") {
        cm.execCommand("goCharRight");
      } else if (type == "skipThree") {
        for (var i = 0; i < 3; i++)
          cm.execCommand("goCharRight");
      } else if (type == "surround") {
        var sels = cm.getSelections();
        for (var i = 0; i < sels.length; i++)
          sels[i] = left + sels[i] + right;
        cm.replaceSelections(sels, "around");
        sels = cm.listSelections().slice();
        for (var i = 0; i < sels.length; i++)
          sels[i] = contractSelection(sels[i]);
        cm.setSelections(sels);
      } else if (type == "both") {
        cm.replaceSelection(left + right, null);
        cm.triggerElectric(left + right);
        cm.execCommand("goCharLeft");
      } else if (type == "addFour") {
        cm.replaceSelection(left + left + left + left, "before");
        cm.execCommand("goCharRight");
      }
    });
  }

  function charsAround(cm, pos) {
    var str = cm.getRange(Pos(pos.line, pos.ch - 1),
                          Pos(pos.line, pos.ch + 1));
    return str.length == 2 ? str : null;
  }

  function stringStartsAfter(cm, pos) {
    var token = cm.getTokenAt(Pos(pos.line, pos.ch + 1))
    return /\bstring/.test(token.type) && token.start == pos.ch &&
      (pos.ch == 0 || !/\bstring/.test(cm.getTokenTypeAt(pos)))
  }
});

define('skylark-minibed/main',[
  "skylark-langx/skylark",
  'skylark-codemirror/CodeMirror',
  "./utils",
  "./api",
  'skylark-codemirror/mode/javascript/javascript',
  'skylark-codemirror/mode/htmlmixed/htmlmixed',
  'skylark-codemirror/mode/jsx/jsx',
  'skylark-codemirror/mode/xml/xml',
  'skylark-codemirror/mode/css/css',
  'skylark-codemirror/addon/scroll/simplescrollbars',
  'skylark-codemirror/addon/edit/matchbrackets',
  'skylark-codemirror/addon/edit/closetag',
  'skylark-codemirror/addon/edit/closebrackets'
],function(skylark,CodeMirror,Utils,API){

  class Minibed {
    /**
     * @param {object} options
     * @return {Minibed}
     */
    constructor (options = {}) {
      this.options = Utils.deepExtend({}, API.Defaults, options)
      this.id = this.options.id || Utils.generateID('bed')
      this.liveTimeout = -1
      this.isLive = false
      this.heightSetted = false
      this.resizer = null

      this.loading = null
      this.wrapper = null
      this.container = null
      this.liveButton = null

      this.has = {
        html: false,
        css: false,
        js: false
      }

      Object.keys(this.options.files).forEach(type => {
        if (this.options.files.hasOwnProperty(type)) {
          for (let i = 0; i < this.options.files[type].length; i++) {
            const ext = Utils.getExtension(this.options.files[type][i])
            if (Utils.inArray(ext, API.FileTypes.html)) {
              this.has.html = true
              continue
            }

            if (Utils.inArray(ext, API.FileTypes.js)) {
              this.has.js = true
              continue
            }

            if (Utils.inArray(ext, API.FileTypes.css)) {
              this.has.css = true
            }
          }
        }
      })

      return this
    }

    /**
     * @return {Minibed}
     */
    show () {
      API.build(this)

      this.container.appendChild(this.wrapper)
      this.loading = this.container.querySelector('.minibed_loading')

      this.bindEvents()
      this.initEditor()
      return this
    }

    bindEvents () {
      const self = this
      const tabs = this.wrapper.querySelectorAll('.minibed_tab')

      tabs.forEach(tab => {
        Utils.addListener(tab, 'click', e => {
          Utils.stopPropagation(e)

          if (!Utils.hasClass(tab, 'minibed_active')) {
            Utils.removeClass(
              self.wrapper.querySelector('.minibed_active'),
              'minibed_active'
            )
            Utils.addClass(tab, 'minibed_active')
          }

          Utils.removeClass(
            self.wrapper.querySelector('.minibed_active_tab'),
            'minibed_active_tab'
          )
          Utils.removeClass(
            self.wrapper.querySelector(
              '.minibed_tab_content[data-lang="' +
                tab.getAttribute('data-lang') +
                '"]'
            ),
            'minibed_selected_content'
          )
          Utils.addClass(
            self.wrapper.querySelector(
              '.minibed_tab_content[data-file="' +
                tab
                  .querySelector('.minibed_tabs_current')
                  .getAttribute('data-current') +
                '"]'
            ),
            'minibed_active_tab minibed_selected_content'
          )

          self.initEditor()
        })
      })

      this.liveButton = this.wrapper.querySelector('.minibed_tab_result')
      Utils.addListener(this.liveButton, 'click', () => {
        this.liveToggle()
      })

      Utils.addListener(this.liveButton.querySelector('label'), 'click', e => {
        e.preventDefault()
        return false
      })

      const dropdownItems = this.wrapper.querySelectorAll(
        '.minibed_dropdown_item'
      )

      dropdownItems.forEach(item => {
        Utils.addListener(item, 'click', e => {
          Utils.stopPropagation(e)
          if (!Utils.hasClass(item, 'minibed_selected_tab')) {
            Utils.removeClass(
              item.parentNode.querySelector('.minibed_selected_tab'),
              'minibed_selected_tab'
            )
            Utils.addClass(item, 'minibed_selected_tab')
            const curr = item.parentNode.parentNode.querySelector(
              '.minibed_tabs_current'
            )
            curr.setAttribute('data-current', item.getAttribute('data-file'))
            curr.click()
          }
        })
      })
    }

    liveToggle () {
      if (Utils.hasClass(this.liveButton, 'mb_live_active')) {
        Utils.removeClass(this.liveButton, 'mb_live_active')
        Utils.removeClass(this.tabContents, 'minibed_live')
        this.liveButton
          .querySelector('#minibed_checkbox-result')
          .removeAttribute('checked')
        this.isLive = false
      } else {
        Utils.addClass(this.liveButton, 'mb_live_active')
        Utils.addClass(this.tabContents, 'minibed_live')
        this.liveButton
          .querySelector('#minibed_checkbox-result')
          .setAttribute('checked', 'checked')
        this.isLive = true
        this.run()
      }
      setTimeout(
        () => {
          this.activeEditor.refresh()
        },
        10
      )
    }

    importCSS () {
      let styleContent = this.container.querySelector(
        '.minibed_selected_content[data-lang="css"]'
      )
      return styleContent
        ? `<style type="text/css">${styleContent.innerHTML}</style>`
        : ''
    }

    importHTML () {
      let htmlContent = this.container.querySelector(
        '.minibed_selected_content[data-lang="htmlmixed"]'
      )
      return htmlContent ? Utils.fixHTML(htmlContent.value) : ''
    }

    importJS () {
      let jsContent = this.container.querySelector(
        '.minibed_selected_content[data-lang="javascript"]'
      )
      return jsContent
        ? `<script type="text/javascript">${jsContent.value}</script>`
        : ''
    }

    importJSError () {
      return `<script type="text/javascript">window.onerror = function(msg, source, lineno, colno, error) {
        console.log(msg, source, lineno, colno, error)
        parent.document.querySelector('.minibed_bed#${this.id} .minibed_result_frame').style.borderBottomColor = '#F44336';
      }</script>`
    }

    importBaseCSS () {
      if (this.options.settings.css.base !== 'none') {
        return `<link rel="stylesheet prefetch" href="${API.Includes[this.options.settings.css.base]}"/>`
      }
      return ''
    }

    importExternalCSS () {
      let styles = ''

      if (this.options.external.css.length > 0) {
        this.options.external.css.forEach(url => {
          styles += `<link rel="stylesheet prefetch" href="${url}"/>`
        })
      }
      return styles
    }

    importExternalJS () {
      let styles = ''

      if (this.options.external.js.length > 0) {
        this.options.external.js.forEach(url => {
          styles += `<script src="${url}" type="text/javascript"></script>\n\n\n`
        })
      }

      return styles
    }

    run () {
      if (this.isLive) {
        Utils.remove(this.container.querySelector('iframe.minibed_result_frame'))

        const resultFrame = new Utils.CreateDOM('iframe.minibed_result_frame')
          .setAttr('src', 'about:blank')
          .setAttr('name', this.id)
        this.tabContents.appendChild(resultFrame.el)

        const frameTemplate = `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>minibed <3</title>
            ${this.importBaseCSS()}
            ${this.importExternalCSS()}
            ${this.importCSS()}
          </head>
          <body>
            ${this.importHTML()}
            ${this.importJSError()}
            ${this.importExternalJS()}
            ${this.importJS()}
          </body>
          </html>`

        const iframe = window.frames[this.id].document
        iframe.open()
        iframe.write(frameTemplate)
        iframe.close()
      }
    }

    initCodeMirror () {
      const self = this

      let mode = this.activeContent.getAttribute('data-lang')

      this.activeEditor = CodeMirror.fromTextArea(this.activeContent, {
        mode: mode,
        tabSize: this.options.settings.tabSize,
        lineNumbers: this.options.settings.lineNumbers,
        lineWrapping: this.options.settings.lineWrapping,
        readOnly: this.options.settings.readOnly,
        styleActiveLine: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        theme: this.options.editorTheme,
        scrollbarStyle: 'simple'
      })

      this.activeEditor.on('change', () => {
        self.activeContent.innerHTML = self.activeEditor.getValue()
        self.activeContent.value = self.activeEditor.getValue()
        clearTimeout(self.liveTimeout)
        self.liveTimeout = setTimeout(
          () => {
            self.run()
          },
          400
        )
      })

      this.tabContents = this.wrapper.querySelector('.minibed_tab_contents')

      if (!self.heightSetted) {
        Utils.css(this.tabContents, {
          height: this.tabContents.offsetHeight + 'px'
        })
      }

      const scroller = this.wrapper.querySelector('.CodeMirror-scroll')

      if (this.options.settings.scrollLock && !Utils.isTouchDevice()) {
        Utils.addListener(scroller, 'mousewheel DOMMouseScroll', e => {
          let delta = e.wheelDelta ||
            (e.originalEvent && e.originalEvent.wheelDelta) ||
            -e.detail
          let bottomOverflow = scroller.scrollTop +
            scroller.getBoundingClientRect().height -
            scroller.scrollHeight >=
            0
          let topOverflow = scroller.scrollTop <= 0
          if ((delta < 0 && bottomOverflow) || (delta > 0 && topOverflow)) {
            e.preventDefault()
          }
        })
      }

      Utils.addClass(this.loading, 'hide')

      this.resizer = new Utils.MBResizable(this.wrapper.querySelector('.CodeMirror'), () => {
        self.activeEditor.refresh()
        Utils.css(self.tabContents, {
          height: self.wrapper.querySelector('.CodeMirror').offsetHeight + 'px'
        })
      })

      this.run()
    }

    initEditor () {
      const self = this
      Utils.removeClass(this.loading, 'hide')

      if (this.activeEditor) {
        this.activeEditor.toTextArea()
      }

      this.activeContent = this.container.querySelector('.minibed_active_tab')

      if (this.activeContent.getAttribute('data-loaded') === 'yes') {
        this.initCodeMirror()
        return
      }

      const allFiles = []
      if (this.has.js) {
        this.options.files.js.forEach(file => {
          allFiles.push(file)
        })
      }
      if (this.has.css) {
        this.options.files.css.forEach(file => {
          allFiles.push(file)
        })
      }
      if (this.has.html) {
        this.options.files.html.forEach(file => {
          allFiles.push(file)
        })
      }

      this.responseCount = 0

      allFiles.forEach(file => {
        Utils.Request(file, data => {
          self.responseCount++
          const textarea = self.wrapper.querySelector(
            '.minibed_tab_content[data-file="' + file + '"]'
          )
          textarea.innerHTML = data
          textarea.setAttribute('data-loaded', 'yes')
        })
      })

      this.responseCheck = window.setInterval(
        () => {
          if (self.responseCount === allFiles.length) {
            window.clearInterval(self.responseCheck)
            self.initCodeMirror()
            self.liveToggle()
          }
        },
        100
      )
    }

    // API functions
    /**
     * @param {Object} obj
     * @return {Minibed}
     */
    static overrideDefaults (obj) {
      API.Defaults = Utils.deepExtend({}, API.Defaults, obj)
      return this
    }

    /**
     * @return {string}
     */
    static version () {
      return VERSION
    }
  }

  return skylark.attach("intg.Minibed", Minibed);
});
define('skylark-minibed', ['skylark-minibed/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-minibed-all.js.map
