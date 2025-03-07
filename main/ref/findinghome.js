// --------------------------------------
// 
//    _  _ _/ .  _  _/ /_ _  _  _        
//   /_|/_ / /|//_  / / //_ /_// /_/     
//   http://activetheory.net     _/      
// 
// --------------------------------------
//   10/16/16 9:54p
// --------------------------------------

if (window.addEventListener) {
    if ("ontouchstart" in window) {
        window.innerWidth = screen.width;
        window.innerHeight = screen.height
    }
    window.addEventListener("load", function() {
        window.innerWidth = document.body.clientWidth;
        window.innerHeight = document.body.clientHeight
    });
    window.addEventListener("resize", function() {
        window.innerWidth = document.body.clientWidth;
        window.innerHeight = document.body.clientHeight
    })
}
window.Global = {};
window.getURL = function(a, b) {
    if (!b) {
        b = "_blank"
    }
    window.open(a, b)
};
if (typeof(console) === "undefined") {
    window.console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = function() {}
}
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(b, a) {
            window.setTimeout(b, 1000 / 60)
        }
    })()
}
window.performance = window.performance || Date;
Date.now = Date.now || function() {
    return +new Date
};
window.Class = function(b, c) {
    var e = this || window;
    var d = b.toString();
    var a = d.match(/function ([^\(]+)/)[1];
    c = (c || "").toLowerCase();
    b.prototype.__call = function() {
        if (this.events) {
            this.events.scope(this)
        }
    };
    if (!c) {
        e[a] = b
    } else {
        if (c == "static") {
            e[a] = new b()
        } else {
            if (c == "singleton") {
                e[a] = (function() {
                    var g = new Object();
                    var f;
                    g.instance = function() {
                        if (!f) {
                            f = new b()
                        }
                        return f
                    };
                    return g
                })()
            }
        }
    }
};
window.Inherit = function(f, a, d) {
    if (typeof d === "undefined") {
        d = f
    }
    var c = new a(d, true);
    var b = {};
    for (var e in c) {
        f[e] = c[e];
        b[e] = c[e]
    }
    if (f.__call) {
        f.__call()
    }
    Render.nextFrame(function() {
        for (e in c) {
            if ((f[e] && b[e]) && f[e] !== b[e]) {
                f["_" + e] = b[e]
            }
        }
        c = b = null
    })
};
window.Implement = function(b, a) {
    Render.nextFrame(function() {
        var c = new a();
        for (var e in c) {
            if (typeof b[e] === "undefined") {
                throw "Interface Error: Missing Property: " + e + " ::: " + a
            } else {
                var d = typeof c[e];
                if (typeof b[e] != d) {
                    throw "Interface Error: Property " + e + " is Incorrect Type ::: " + a
                }
            }
        }
    })
};
window.Namespace = function(a) {
    if (typeof a === "string") {
        window[a] = {
            Class: window.Class
        }
    } else {
        a.Class = window.Class
    }
};
window.Interface = function(b) {
    var a = b.toString().match(/function ([^\(]+)/)[1];
    Hydra.INTERFACES[a] = b
};
Class(function HydraObject(c, d, b, g) {
    var f = this;
    var h;
    var j = HydraObject.prototype;
    this._events = {};
    this._children = new LinkedList();
    this.__useFragment = g;
    (function() {
        e()
    })();

    function e() {
        if (c && typeof c !== "string") {
            f.div = c
        } else {
            var l = c ? c.charAt(0) : null;
            var k = c ? c.slice(1) : null;
            if (l != "." && l != "#") {
                k = c;
                l = "."
            }
            if (!b) {
                f._type = d || "div";
                f.div = document.createElement(f._type);
                if (l) {
                    if (l == "#") {
                        f.div.id = k
                    } else {
                        f.div.className = k
                    }
                }
            } else {
                if (l != "#") {
                    throw "Hydra Selectors Require #ID"
                }
                f.div = document.getElementById(k)
            }
        }
        f.div.hydraObject = f
    }

    function a() {
        if (!h) {
            return false
        }
        f.div.appendChild(h);
        h = null
    }
    this.addChild = this.add = function(l) {
        var k = this.div;
        if (this.__useFragment) {
            if (!h) {
                h = document.createDocumentFragment();
                Render.nextFrame(a)
            }
            k = h
        }
        if (l.element && l.element instanceof HydraObject) {
            k.appendChild(l.element.div);
            this._children.push(l.element);
            l.element._parent = this
        } else {
            if (l.div) {
                k.appendChild(l.div);
                this._children.push(l);
                l._parent = this
            } else {
                if (l.nodeName) {
                    k.appendChild(l)
                }
            }
        }
        return this
    };
    if (typeof j.clone !== "undefined") {
        return
    }
    j.clone = function() {
        return $(this.div.cloneNode(true))
    };
    j.create = function(k, l) {
        var m = $(k, l);
        this.addChild(m);
        if (this.__root) {
            this.__root.__append[k] = m;
            m.__root = this.__root
        }
        return m
    };
    j.empty = function() {
        var k = this._children.start();
        while (k) {
            if (k && k.remove) {
                k.remove()
            }
            k = this._children.next()
        }
        this.div.innerHTML = "";
        return this
    };
    j.parent = function() {
        return this._parent
    };
    j.children = function() {
        return this.div.children ? this.div.children : this.div.childNodes
    };
    j.append = function(l, k) {
        if (!this.__root) {
            this.__root = this;
            this.__append = {}
        }
        return l.apply(this, k)
    };
    j.removeChild = function(l, k) {
        if (!k) {
            try {
                this.div.removeChild(l.div)
            } catch (m) {}
        }
        this._children.remove(l)
    };
    j.remove = function(m) {
        var k = this._parent;
        if (k && !k.removed && k.removeChild) {
            k.removeChild(this)
        }
        if (!m) {
            var l = this._children.start();
            while (l) {
                if (l && l.remove) {
                    l.remove()
                }
                l = this._children.next()
            }
            this._children.empty();
            this.removed = true;
            Utils.nullObject(this)
        }
    }
});
Class(function Hydra() {
    var f = this;
    var d, b;
    var e = [];
    this.READY = false;
    this.HASH = window.location.hash.slice(1);
    this.LOCAL = location.hostname.indexOf("local") > -1 || location.hostname.split(".")[0] == "10" || location.hostname.split(".")[0] == "192";
    (function() {
        a()
    })();

    function a() {
        if (!document || !window) {
            return setTimeout(a, 1)
        }
        if (window._NODE_) {
            return setTimeout(c, 1)
        }
        if (window.addEventListener) {
            f.addEvent = "addEventListener";
            f.removeEvent = "removeEventListener";
            window.addEventListener("load", c, false)
        } else {
            f.addEvent = "attachEvent";
            f.removeEvent = "detachEvent";
            window.attachEvent("onload", c)
        }
    }

    function c() {
        if (window.removeEventListener) {
            window.removeEventListener("load", c, false)
        }
        for (var g = 0; g < e.length; g++) {
            e[g]()
        }
        e = null;
        f.READY = true;
        if (window.Main) {
            Hydra.Main = new window.Main()
        }
    }
    this.development = function(g) {
        if (!g) {
            clearInterval(d)
        } else {
            d = setInterval(function() {
                for (var l in window) {
                    if (l.strpos("webkit")) {
                        continue
                    }
                    var k = window[l];
                    if (typeof k !== "function" && l.length > 2) {
                        if (l.strpos("_ga") || l.strpos("_typeface_js")) {
                            continue
                        }
                        var j = l.charAt(0);
                        var h = l.charAt(1);
                        if (j == "_" || j == "$") {
                            if (h !== h.toUpperCase()) {
                                console.log(window[l]);
                                throw "Hydra Warning:: " + l + " leaking into global scope"
                            }
                        }
                    }
                }
            }, 1000)
        }
    };
    this.getArguments = function(k) {
        var j = this.arguments;
        var g = [];
        for (var h = 1; h < j.length; h++) {
            g.push(j[h])
        }
        return g
    };
    this.ready = function(g) {
        if (this.READY) {
            return g()
        }
        e.push(g)
    };
    this.$ = function(g, h, j) {
        return new HydraObject(g, h, j)
    };
    this.INTERFACES = {};
    this.HTML = {};
    this.SHADERS = {};
    this.JSON = {};
    this.$.fn = HydraObject.prototype;
    window.$ = this.$
}, "Static");
Hydra.ready(function() {
    window.__window = $(window);
    window.__document = $(document);
    window.__body = $(document.getElementsByTagName("body")[0]);
    window.Stage = __body.create("#Stage");
    Stage.size("100%");
    Stage.__useFragment = true;
    Stage.width = window.innerWidth || document.documentElement.offsetWidth;
    Stage.height = window.innerHeight || document.documentElement.offsetHeight;
    (function() {
        var b = Date.now();
        var a;
        setTimeout(function() {
            var g = ["hidden", "msHidden", "webkitHidden"];
            var f, e;
            (function() {
                for (var h in g) {
                    if (document[g[h]] !== "undefined") {
                        f = g[h];
                        switch (f) {
                            case "hidden":
                                e = "visibilitychange";
                                break;
                            case "msHidden":
                                e = "msvisibilitychange";
                                break;
                            case "webkitHidden":
                                e = "webkitvisibilitychange";
                                break
                        }
                        return
                    }
                }
            })();
            if (typeof document[f] === "undefined") {
                if (Device.browser.ie) {
                    document.onfocus = c;
                    document.onblur = d
                } else {
                    window.onfocus = c;
                    window.onblur = d
                }
            } else {
                document.addEventListener(e, function() {
                    var h = Date.now();
                    if (h - b > 10) {
                        if (document[f] === false) {
                            c()
                        } else {
                            d()
                        }
                    }
                    b = h
                })
            }
        }, 250);

        function c() {
            if (a != "focus") {
                HydraEvents._fireEvent(HydraEvents.BROWSER_FOCUS, {
                    type: "focus"
                })
            }
            a = "focus"
        }

        function d() {
            if (a != "blur") {
                HydraEvents._fireEvent(HydraEvents.BROWSER_FOCUS, {
                    type: "blur"
                })
            }
            a = "blur"
        }
    })();
    window.onresize = function() {
        if (!Device.mobile) {
            Stage.width = window.innerWidth || document.documentElement.offsetWidth;
            Stage.height = window.innerHeight || document.documentElement.offsetHeight;
            HydraEvents._fireEvent(HydraEvents.RESIZE)
        }
    }
});
(function() {
    $.fn.text = function(a) {
        if (typeof a !== "undefined") {
            this.div.textContent = a;
            return this
        } else {
            return this.div.textContent
        }
    };
    $.fn.html = function(a) {
        if (typeof a !== "undefined") {
            this.div.innerHTML = a;
            return this
        } else {
            return this.div.innerHTML
        }
    };
    $.fn.hide = function() {
        this.div.style.display = "none";
        return this
    };
    $.fn.show = function() {
        this.div.style.display = "block";
        return this
    };
    $.fn.visible = function() {
        this.div.style.visibility = "visible";
        return this
    };
    $.fn.invisible = function() {
        this.div.style.visibility = "hidden";
        return this
    };
    $.fn.setZ = function(a) {
        this.div.style.zIndex = a;
        return this
    };
    $.fn.clearAlpha = function() {
        this.div.style.opacity = "";
        return this
    };
    $.fn.size = function(a, b, c) {
        if (typeof a === "string") {
            if (typeof b === "undefined") {
                b = "100%"
            } else {
                if (typeof b !== "string") {
                    b = b + "px"
                }
            }
            this.div.style.width = a;
            this.div.style.height = b
        } else {
            this.div.style.width = a + "px";
            this.div.style.height = b + "px";
            if (!c) {
                this.div.style.backgroundSize = a + "px " + b + "px"
            }
        }
        this.width = a;
        this.height = b;
        return this
    };
    $.fn.mouseEnabled = function(a) {
        this.div.style.pointerEvents = a ? "auto" : "none";
        return this
    };
    $.fn.fontStyle = function(e, c, b, d) {
        var a = {};
        if (e) {
            a.fontFamily = e
        }
        if (c) {
            a.fontSize = c
        }
        if (b) {
            a.color = b
        }
        if (d) {
            a.fontStyle = d
        }
        this.css(a);
        return this
    };
    $.fn.bg = function(c, a, d, b) {
        if (!c) {
            return this
        }
        if (!c.strpos(".")) {
            this.div.style.backgroundColor = c
        } else {
            this.div.style.backgroundImage = "url(" + c + ")"
        }
        if (typeof a !== "undefined") {
            a = typeof a == "number" ? a + "px" : a;
            d = typeof d == "number" ? d + "px" : d;
            this.div.style.backgroundPosition = a + " " + d
        }
        if (b) {
            this.div.style.backgroundSize = "";
            this.div.style.backgroundRepeat = b
        }
        if (a == "cover" || a == "contain") {
            this.div.style.backgroundSize = a;
            this.div.style.backgroundPosition = typeof d != "undefined" ? d + " " + b : "center"
        }
        return this
    };
    $.fn.center = function(a, c) {
        var b = {};
        if (typeof a === "undefined") {
            b.left = "50%";
            b.top = "50%";
            b.marginLeft = -this.width / 2;
            b.marginTop = -this.height / 2
        } else {
            if (a) {
                b.left = "50%";
                b.marginLeft = -this.width / 2
            }
            if (c) {
                b.top = "50%";
                b.marginTop = -this.height / 2
            }
        }
        this.css(b);
        return this
    };
    $.fn.mask = function(b, a, e, c, d) {
        this.div.style[CSS.prefix("Mask")] = (b.strpos(".") ? "url(" + b + ")" : b) + " no-repeat";
        return this
    };
    $.fn.blendMode = function(b, a) {
        if (a) {
            this.div.style["background-blend-mode"] = b
        } else {
            this.div.style["mix-blend-mode"] = b
        }
        return this
    };
    $.fn.css = function(d, c) {
        if (typeof c == "boolean") {
            skip = c;
            c = null
        }
        if (typeof d !== "object") {
            if (!c) {
                var b = this.div.style[d];
                if (typeof b !== "number") {
                    if (b.strpos("px")) {
                        b = Number(b.slice(0, -2))
                    }
                    if (d == "opacity") {
                        b = 1
                    }
                }
                if (!b) {
                    b = 0
                }
                return b
            } else {
                this.div.style[d] = c;
                return this
            }
        }
        TweenManager.clearCSSTween(this);
        for (var a in d) {
            var e = d[a];
            if (!(typeof e === "string" || typeof e === "number")) {
                continue
            }
            if (typeof e !== "string" && a != "opacity" && a != "zIndex") {
                e += "px"
            }
            this.div.style[a] = e
        }
        return this
    };
    $.fn.transform = function(b) {
        TweenManager.clearCSSTween(this);
        if (Device.tween.css2d) {
            if (!b) {
                b = this
            } else {
                for (var a in b) {
                    if (typeof b[a] === "number") {
                        this[a] = b[a]
                    }
                }
            }
            if (!this._matrix) {
                this.div.style[Device.styles.vendorTransform] = TweenManager.parseTransform(b)
            } else {
                if (this._matrix.type == "matrix2") {
                    this._matrix.setTRS(this.x, this.y, this.rotation, this.scaleX || this.scale, this.scaleY || this.scale)
                } else {
                    this._matrix.setTRS(this.x, this.y, this.z, this.rotationX, this.rotationY, this.rotationZ, this.scaleX || this.scale, this.scaleY || this.scale, this.scaleZ || this.scale)
                }
                this.div.style[Device.styles.vendorTransform] = this._matrix.getCSS()
            }
        }
        return this
    };
    $.fn.useMatrix3D = function() {
        this._matrix = new Matrix4();
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.scale = 1;
        return this
    };
    $.fn.useMatrix2D = function() {
        this._matrix = new Matrix2();
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scale = 1;
        return this
    };
    $.fn.accelerate = function() {
        this.__accelerated = true;
        if (!this.z) {
            this.z = 0;
            this.transform()
        }
    };
    $.fn.backfaceVisibility = function(a) {
        if (a) {
            this.div.style[CSS.prefix("BackfaceVisibility")] = "visible"
        } else {
            this.div.style[CSS.prefix("BackfaceVisibility")] = "hidden"
        }
    };
    $.fn.enable3D = function(b, a, c) {
        this.div.style[CSS.prefix("TransformStyle")] = "preserve-3d";
        if (b) {
            this.div.style[CSS.prefix("Perspective")] = b + "px"
        }
        if (typeof a !== "undefined") {
            a = typeof a === "number" ? a + "px" : a;
            c = typeof c === "number" ? c + "px" : c;
            this.div.style[CSS.prefix("PerspectiveOrigin")] = a + " " + c
        }
        return this
    };
    $.fn.disable3D = function() {
        this.div.style[CSS.prefix("TransformStyle")] = "";
        this.div.style[CSS.prefix("Perspective")] = "";
        return this
    };
    $.fn.transformPoint = function(a, d, c) {
        var b = "";
        if (typeof a !== "undefined") {
            b += (typeof a === "number" ? a + "px " : a)
        }
        if (typeof d !== "undefined") {
            b += (typeof d === "number" ? d + "px " : d)
        }
        if (typeof c !== "undefined") {
            b += (typeof c === "number" ? c + "px" : c)
        }
        this.div.style[CSS.prefix("TransformOrigin")] = b;
        return this
    };
    $.fn.tween = function(c, d, e, a, f, b) {
        if (typeof a === "boolean") {
            b = a;
            a = 0;
            f = null
        } else {
            if (typeof a === "function") {
                f = a;
                a = 0
            }
        }
        if (typeof f === "boolean") {
            b = f;
            f = null
        }
        if (!a) {
            a = 0
        }
        return TweenManager._detectTween(this, c, d, e, a, f, b)
    };
    $.fn.clearTransform = function() {
        if (typeof this.x === "number") {
            this.x = 0
        }
        if (typeof this.y === "number") {
            this.y = 0
        }
        if (typeof this.z === "number") {
            this.z = 0
        }
        if (typeof this.scale === "number") {
            this.scale = 1
        }
        if (typeof this.scaleX === "number") {
            this.scaleX = 1
        }
        if (typeof this.scaleY === "number") {
            this.scaleY = 1
        }
        if (typeof this.rotation === "number") {
            this.rotation = 0
        }
        if (typeof this.rotationX === "number") {
            this.rotationX = 0
        }
        if (typeof this.rotationY === "number") {
            this.rotationY = 0
        }
        if (typeof this.rotationZ === "number") {
            this.rotationZ = 0
        }
        if (typeof this.skewX === "number") {
            this.skewX = 0
        }
        if (typeof this.skewY === "number") {
            this.skewY = 0
        }
        if (!this.__accelerated) {
            this.div.style[Device.styles.vendorTransform] = ""
        } else {
            this.accelerate()
        }
        return this
    };
    $.fn.stopTween = function() {
        if (this._cssTween) {
            this._cssTween.stop()
        }
        if (this._mathTween) {
            this._mathTween.stop()
        }
        return this
    };
    $.fn.keypress = function(a) {
        this.div.onkeypress = function(b) {
            b = b || window.event;
            b.code = b.keyCode ? b.keyCode : b.charCode;
            a(b)
        }
    };
    $.fn.keydown = function(a) {
        this.div.onkeydown = function(b) {
            b = b || window.event;
            b.code = b.keyCode;
            a(b)
        }
    };
    $.fn.keyup = function(a) {
        this.div.onkeyup = function(b) {
            b = b || window.event;
            b.code = b.keyCode;
            a(b)
        }
    };
    $.fn.attr = function(a, b) {
        if (a && b) {
            if (b == "") {
                this.div.removeAttribute(a)
            } else {
                this.div.setAttribute(a, b)
            }
        } else {
            if (a) {
                return this.div.getAttribute(a)
            }
        }
        return this
    };
    $.fn.val = function(a) {
        if (typeof a === "undefined") {
            return this.div.value
        } else {
            this.div.value = a
        }
        return this
    };
    $.fn.change = function(b) {
        var a = this;
        if (this._type == "select") {
            this.div.onchange = function() {
                b({
                    object: a,
                    value: a.div.value || ""
                })
            }
        }
    }
})();
(function() {
    var a = !!("pointerdown" in window);
    var b = !a && window.navigator.msPointerEnabled;
    var c = function(d) {
        if (Hydra.addEvent == "attachEvent") {
            switch (d) {
                case "click":
                    return "onclick";
                    break;
                case "mouseover":
                    return "onmouseover";
                    break;
                case "mouseout":
                    return "onmouseleave";
                    break;
                case "mousedown":
                    return "onmousedown";
                    break;
                case "mouseup":
                    return "onmouseup";
                    break;
                case "mousemove":
                    return "onmousemove";
                    break
            }
        }
        if (a || b) {
            switch (d) {
                case "touchstart":
                    return (a ? "onpointerdown" : b ? "onmspointerdown" : "ontouchstart");
                    break;
                case "touchmove":
                    return (a ? "onpointermove" : b ? "onmspointermove" : "ontouchmove");
                    break;
                case "touchend":
                    return (a ? "onpointerup" : b ? "onmspointerup" : "ontouchend");
                    break;
                case "touchcancel":
                    return (a ? "onpointercancel" : b ? "onmspointercancel" : "ontouchcancel");
                    break
            }
        }
        return d
    };
    $.fn.click = function(f) {
        var e = this;

        function d(g) {
            if (!e.div) {
                return false
            }
            if (Mouse._preventClicks) {
                return false
            }
            g.object = e.div.className == "hit" ? e.parent() : e;
            g.action = "click";
            if (!g.pageX) {
                g.pageX = g.clientX;
                g.pageY = g.clientY
            }
            if (f) {
                f(g)
            }
            if (Mouse.autoPreventClicks) {
                Mouse.preventClicks()
            }
        }
        this.div[Hydra.addEvent](c("click"), d, true);
        this.div.style.cursor = "pointer";
        return this
    };
    $.fn.hover = function(j) {
        var h = this;
        var g = false;
        var f;

        function d(m) {
            if (!h.div) {
                return false
            }
            var l = Date.now();
            var k = m.toElement || m.relatedTarget;
            if (f && (l - f) < 5) {
                f = l;
                return false
            }
            f = l;
            m.object = h.div.className == "hit" ? h.parent() : h;
            switch (m.type) {
                case "mouseout":
                    m.action = "out";
                    break;
                case "mouseleave":
                    m.action = "out";
                    break;
                default:
                    m.action = "over";
                    break
            }
            if (g) {
                if (Mouse._preventClicks) {
                    return false
                }
                if (m.action == "over") {
                    return false
                }
                if (m.action == "out") {
                    if (e(h.div, k)) {
                        return false
                    }
                }
                g = false
            } else {
                if (m.action == "out") {
                    return false
                }
                g = true
            }
            if (!m.pageX) {
                m.pageX = m.clientX;
                m.pageY = m.clientY
            }
            if (j) {
                j(m)
            }
        }

        function e(n, l) {
            var k = n.children.length - 1;
            for (var m = k; m > -1; m--) {
                if (l == n.children[m]) {
                    return true
                }
            }
            for (m = k; m > -1; m--) {
                if (e(n.children[m], l)) {
                    return true
                }
            }
        }
        this.div[Hydra.addEvent](c("mouseover"), d, true);
        this.div[Hydra.addEvent](c("mouseout"), d, true);
        return this
    };
    $.fn.press = function(f) {
        var e = this;

        function d(g) {
            if (!e.div) {
                return false
            }
            g.object = e.div.className == "hit" ? e.parent() : e;
            switch (g.type) {
                case "mousedown":
                    g.action = "down";
                    break;
                default:
                    g.action = "up";
                    break
            }
            if (!g.pageX) {
                g.pageX = g.clientX;
                g.pageY = g.clientY
            }
            if (f) {
                f(g)
            }
        }
        this.div[Hydra.addEvent](c("mousedown"), d, true);
        this.div[Hydra.addEvent](c("mouseup"), d, true);
        return this
    };
    $.fn.bind = function(f, j) {
        if (f == "touchstart") {
            if (!Device.mobile) {
                f = "mousedown"
            }
        } else {
            if (f == "touchmove") {
                if (!Device.mobile) {
                    f = "mousemove"
                }
            } else {
                if (f == "touchend") {
                    if (!Device.mobile) {
                        f = "mouseup"
                    }
                }
            }
        }
        this._events["bind_" + f] = this._events["bind_" + f] || [];
        var h = this._events["bind_" + f];
        var g = {};
        g.callback = j;
        g.target = this.div;
        h.push(g);

        function d(m) {
            var n = Utils.touchEvent(m);
            m.x = n.x;
            m.y = n.y;
            for (var k = 0; k < h.length; k++) {
                var l = h[k];
                if (l.target == m.currentTarget) {
                    l.callback(m)
                }
            }
        }
        if (!this._events["fn_" + f]) {
            this._events["fn_" + f] = d;
            this.div[Hydra.addEvent](c(f), d, true)
        }
        return this
    };
    $.fn.unbind = function(d, h) {
        if (d == "touchstart") {
            if (!Device.mobile) {
                d = "mousedown"
            }
        } else {
            if (d == "touchmove") {
                if (!Device.mobile) {
                    d = "mousemove"
                }
            } else {
                if (d == "touchend") {
                    if (!Device.mobile) {
                        d = "mouseup"
                    }
                }
            }
        }
        var g = this._events["bind_" + d];
        if (!g) {
            return this
        }
        for (var e = 0; e < g.length; e++) {
            var f = g[e];
            if (f.callback == h) {
                g.splice(e, 1)
            }
        }
        if (this._events["fn_" + d] && !g.length) {
            this.div[Hydra.removeEvent](c(d), this._events["fn_" + d], true);
            this._events["fn_" + d] = null
        }
        return this
    };
    $.fn.interact = function(e, d) {
        if (!this.hit) {
            this.hit = $(".hit");
            this.hit.css({
                width: "100%",
                height: "100%",
                zIndex: 99999,
                top: 0,
                left: 0,
                position: "absolute",
                background: "rgba(255, 255, 255, 0)"
            });
            this.addChild(this.hit)
        }
        if (!Device.mobile) {
            this.hit.hover(e).click(d)
        } else {
            this.hit.touchClick(e, d)
        }
    };
    $.fn.touchSwipe = function(k) {
        if (!window.addEventListener) {
            return this
        }
        var f = this;
        var d = 75;
        var m, l;
        var g = false;
        var n = {};
        if (Device.mobile) {
            if (this._events.touchswipe) {
                this.touchSwipe(null, true)
            }
            this.div.addEventListener(c("touchstart"), e);
            this.div.addEventListener(c("touchend"), j);
            this.div.addEventListener(c("touchcancel"), j);
            this._events.touchswipe = true
        }

        function e(o) {
            var p = Utils.touchEvent(o);
            if (!f.div) {
                return false
            }
            if (o.touches.length == 1) {
                m = p.x;
                l = p.y;
                g = true;
                f.div.addEventListener(c("touchmove"), h)
            }
        }

        function h(q) {
            if (!f.div) {
                return false
            }
            if (g) {
                var r = Utils.touchEvent(q);
                var p = m - r.x;
                var o = l - r.y;
                n.direction = null;
                n.moving = null;
                n.x = null;
                n.y = null;
                n.evt = q;
                if (Math.abs(p) >= d) {
                    j();
                    if (p > 0) {
                        n.direction = "left"
                    } else {
                        n.direction = "right"
                    }
                } else {
                    if (Math.abs(o) >= d) {
                        j();
                        if (o > 0) {
                            n.direction = "up"
                        } else {
                            n.direction = "down"
                        }
                    } else {
                        n.moving = true;
                        n.x = p;
                        n.y = o
                    }
                }
                if (k) {
                    k(n)
                }
            }
        }

        function j(o) {
            if (!f.div) {
                return false
            }
            m = l = g = false;
            f.div.removeEventListener(c("touchmove"), h)
        }
        return this
    };
    $.fn.touchClick = function(g, m) {
        if (!window.addEventListener) {
            return this
        }
        var f = this;
        var o, n;
        var e = {};
        var h = {};
        if (Device.mobile) {
            this.div.addEventListener(c("touchmove"), j, false);
            this.div.addEventListener(c("touchstart"), d, false);
            this.div.addEventListener(c("touchend"), k, false)
        }

        function j(p) {
            if (!f.div) {
                return false
            }
            h = Utils.touchEvent(p);
            if (Utils.findDistance(e, h) > 20) {
                n = true
            } else {
                n = false
            }
        }

        function l(p) {
            var q = Utils.touchEvent(p);
            p.touchX = q.x;
            p.touchY = q.y;
            e.x = p.touchX;
            e.y = p.touchY
        }

        function d(p) {
            if (!f.div) {
                return false
            }
            o = Date.now();
            p.action = "over";
            p.object = f.div.className == "hit" ? f.parent() : f;
            l(p);
            if (g) {
                g(p)
            }
        }

        function k(r) {
            if (!f.div) {
                return false
            }
            var q = Date.now();
            var p = false;
            r.object = f.div.className == "hit" ? f.parent() : f;
            l(r);
            if (o && q - o < 750) {
                if (Mouse._preventClicks) {
                    return false
                }
                if (m && !n) {
                    p = true;
                    r.action = "click";
                    if (m && !n) {
                        m(r)
                    }
                    if (Mouse.autoPreventClicks) {
                        Mouse.preventClicks()
                    }
                }
            }
            if (g) {
                r.action = "out";
                if (!Mouse._preventFire) {
                    g(r)
                }
            }
            n = false
        }
        return this
    }
})();
Class(function MVC() {
    Inherit(this, Events);
    var a = {};
    this.classes = {};

    function b(d, c) {
        a[c] = {};
        Object.defineProperty(d, c, {
            set: function(e) {
                if (a[c]) {
                    a[c].s.apply(d, [e])
                }
            },
            get: function() {
                if (a[c]) {
                    return a[c].g.apply(d)
                }
            }
        })
    }
    this.set = function(d, c) {
        if (!a[d]) {
            b(this, d)
        }
        a[d].s = c
    };
    this.get = function(d, c) {
        if (!a[d]) {
            b(this, d)
        }
        a[d].g = c
    };
    this.delayedCall = function(f, c, d) {
        var e = this;
        return setTimeout(function() {
            if (e.destroy) {
                f.apply(e, [d])
            }
        }, c || 0)
    };
    this.initClass = function(n, q, p, o, m, l, k, j) {
        var h = Utils.timestamp();
        Hydra.arguments = arguments;
        this.classes[h] = new n(q, p, o, m, l, k, j);
        Hydra.arguments = null;
        this.classes[h].parent = this;
        this.classes[h].__id = h;
        if (this.element && arguments[arguments.length - 1] !== null) {
            this.element.addChild(this.classes[h])
        }
        return this.classes[h]
    };
    this.destroy = function() {
        if (this.container) {
            Global[this.container.div.id.toUpperCase()] = null
        }
        for (var d in this.classes) {
            var c = this.classes[d];
            if (c.destroy) {
                c.destroy()
            }
        }
        this.classes = null;
        if (this.events) {
            this.events = this.events.destroy()
        }
        if (this.element && this.element.remove) {
            this.element = this.container = this.element.remove()
        }
        if (this.parent && this.parent.__destroyChild) {
            this.parent.__destroyChild(this.__id)
        }
        return Utils.nullObject(this)
    };
    this.__destroyChild = function(c) {
        this.classes[c] = null;
        delete this.classes[c]
    }
});
Class(function Model(a) {
    Inherit(this, MVC);
    var b = {};
    this.push = function(c, d) {
        b[c] = d
    };
    this.pull = function(c) {
        return b[c]
    };
    this.initWithData = function(f) {
        for (var e in this) {
            var c = this[e];
            for (var d in f) {
                if (d.toLowerCase() == e.toLowerCase()) {
                    if (c.init) {
                        c.init(f[d])
                    }
                }
            }
        }
    };
    this.loadData = function(c, e) {
        var d = this;
        XHR.get(c, function(f) {
            d.initWithData(f);
            e(f)
        })
    };
    this.Class = function(d) {
        var c = d.toString().match(/function ([^\(]+)/)[1];
        this[c] = new d()
    }
});
Class(function View(c) {
    Inherit(this, MVC);
    var e;
    var f = function(h) {
        e.apply(h.ui);
        h.events.subscribe(HydraEvents.RESIZE, function() {
            e.apply(h.ui)
        })
    };
    c = c.constructor.toString().match(/function ([^\(]+)/)[1];
    this.element = $("." + c);
    this.element.__useFragment = true;
    this.css = function(h) {
        this.element.css(h);
        return this
    };
    this.transform = function(h) {
        this.element.transform(h || this);
        return this
    };
    this.tween = function(k, l, m, h, n, j) {
        return this.element.tween(k, l, m, h, n, j)
    };
    var b = Hydra.INTERFACES[c] || Hydra.INTERFACES[c + "UI"];
    if (b) {
        this.ui = {};
        var g = Hydra.getArguments();
        g.push(this);
        e = this.element.append(b, g);
        var a = this.element.__append;
        for (var d in a) {
            this.ui[d] = a[d]
        }
    }
    this.__call = function() {
        this.events.scope(this);
        if (e) {
            f(this)
        }
    }
});
Class(function Controller(a) {
    Inherit(this, MVC);
    a = a.constructor.toString().match(/function ([^\(]+)/)[1];
    this.element = this.container = $("#" + a);
    this.element.__useFragment = true;
    this.css = function(b) {
        this.container.css(b)
    }
});
Class(function Component() {
    Inherit(this, MVC);
    this.__call = function() {
        this.events.scope(this);
        delete this.__call
    }
});
Class(function Utils() {
    var d = this;
    if (typeof Float32Array == "undefined") {
        Float32Array = Array
    }

    function a(e) {
        e = parseInt(e, 10);
        if (isNaN(e)) {
            return "00"
        }
        e = Math.max(0, Math.min(e, 255));
        return "0123456789ABCDEF".charAt((e - e % 16) / 16) + "0123456789ABCDEF".charAt(e % 16)
    }

    function c(f, e) {
        return b(Math.random(), f, e)
    }

    function b(f, g, e) {
        return g + (e - g) * f
    }
    this.doRandom = function(f, e) {
        return Math.round(c(f - 0.5, e + 0.5))
    };
    this.headsTails = function(f, g) {
        var e = d.doRandom(0, 1);
        if (!e) {
            return f
        } else {
            return g
        }
    };
    this.toDegrees = function(e) {
        return e * (180 / Math.PI)
    };
    this.toRadians = function(e) {
        return e * (Math.PI / 180)
    };
    this.findDistance = function(h, g) {
        var f = g.x - h.x;
        var e = g.y - h.y;
        return Math.sqrt(f * f + e * e)
    };
    this.timestamp = function() {
        var e = Date.now() + d.doRandom(0, 99999);
        return e.toString()
    };
    this.rgbToHex = function(f, e, g) {
        return a(f) + a(e) + a(g)
    };
    this.hexToRGB = function(f) {
        var e = [];
        f.replace(/(..)/g, function(g) {
            e.push(parseInt(g, 16))
        });
        return e
    };
    this.getBackground = function(f) {
        var e = f.css("backgroundImage");
        if (e.length) {
            e = e.replace('("', "(");
            e = e.replace('")', ")");
            e = e.split("(");
            e = e[1].slice(0, -1)
        }
        return e
    };
    this.hitTestObject = function(l, k) {
        var f = l.x,
            p = l.y,
            q = l.width,
            m = l.height;
        var t = k.x,
            j = k.y,
            o = k.width,
            s = k.height;
        var e = f + q,
            n = p + m,
            r = t + o,
            g = j + s;
        if (t >= f && t <= e) {
            if (j >= p && j <= n) {
                return true
            } else {
                if (p >= j && p <= g) {
                    return true
                }
            }
        } else {
            if (f >= t && f <= r) {
                if (j >= p && j <= n) {
                    return true
                } else {
                    if (p >= j && p <= g) {
                        return true
                    }
                }
            }
        }
        return false
    };
    this.randomColor = function() {
        var e = "#" + Math.floor(Math.random() * 16777215).toString(16);
        if (e.length < 7) {
            e = this.randomColor()
        }
        return e
    };
    this.touchEvent = function(g) {
        var f = {};
        f.x = 0;
        f.y = 0;
        if (!g) {
            return f
        }
        if (g.touches || g.changedTouches) {
            if (g.changedTouches.length) {
                f.x = g.changedTouches[0].pageX;
                f.y = g.changedTouches[0].pageY - Mobile.scrollTop
            } else {
                f.x = g.touches[0].pageX;
                f.y = g.touches[0].pageY - Mobile.scrollTop
            }
        } else {
            f.x = g.pageX;
            f.y = g.pageY
        }
        return f
    };
    this.clamp = function(f, g, e) {
        return Math.min(Math.max(f, g), e)
    };
    this.constrain = function(f, g, e) {
        return Math.min(Math.max(f, Math.min(g, e)), Math.max(g, e))
    };
    this.nullObject = function(e) {
        if (e.destroy) {
            for (var f in e) {
                if (typeof e[f] !== "undefined") {
                    e[f] = null
                }
            }
        }
        return null
    };
    this.convertRange = function(f, j, g, l, h) {
        var k = (g - j);
        var e = (h - l);
        return (((f - j) * e) / k) + l
    };
    String.prototype.strpos = function(e) {
        return this.indexOf(e) != -1
    };
    String.prototype.clip = function(f, e) {
        return this.length > f ? this.slice(0, f) + e : this
    };
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1)
    };
    Array.prototype.findAndRemove = function(e) {
        var f = this.indexOf(e);
        if (f > -1) {
            this.splice(f, 1)
        }
    }
}, "Static");
Class(function CSS() {
    var g = this;
    var f, b, a;
    Hydra.ready(function() {
        b = "";
        f = document.createElement("style");
        f.type = "text/css";
        document.getElementsByTagName("head")[0].appendChild(f)
    });

    function d(k) {
        var j = k.match(/[A-Z]/);
        var l = j ? j.index : null;
        if (l) {
            var m = k.slice(0, l);
            var h = k.slice(l);
            k = m + "-" + h.toLowerCase()
        }
        return k
    }

    function e(k) {
        var j = k.match(/\-/);
        var m = j ? j.index : null;
        if (m) {
            var n = k.slice(0, m);
            var h = k.slice(m).slice(1);
            var l = h.charAt(0);
            h = h.slice(1);
            h = l.toUpperCase() + h;
            k = n + h
        }
        return k
    }

    function c() {
        f.innerHTML = b;
        a = false
    }
    this._read = function() {
        return b
    };
    this._write = function(h) {
        b = h;
        if (!a) {
            a = true;
            Render.nextFrame(c)
        }
    };
    this._toCSS = d;
    this.style = function(h, l) {
        var k = h + " {";
        for (var j in l) {
            var n = d(j);
            var m = l[j];
            if (typeof m !== "string" && j != "opacity") {
                m += "px"
            }
            k += n + ":" + m + "!important;"
        }
        k += "}";
        f.innerHTML += k
    };
    this.get = function(k, h) {
        var q = new Object();
        var n = f.innerHTML.split(k + " {");
        for (var m = 0; m < n.length; m++) {
            var o = n[m];
            if (!o.length) {
                continue
            }
            var p = o.split("!important;");
            for (var l in p) {
                if (p[l].strpos(":")) {
                    var r = p[l].split(":");
                    if (r[1].slice(-2) == "px") {
                        r[1] = Number(r[1].slice(0, -2))
                    }
                    q[e(r[0])] = r[1]
                }
            }
        }
        if (!h) {
            return q
        } else {
            return q[h]
        }
    };
    this.textSize = function(l) {
        var k = l.clone();
        k.css({
            position: "relative",
            cssFloat: "left",
            styleFloat: "left",
            marginTop: -99999,
            width: "",
            height: ""
        });
        __body.addChild(k);
        var j = k.div.offsetWidth;
        var h = k.div.offsetHeight;
        k.remove();
        return {
            width: j,
            height: h
        }
    };
    this.prefix = function(h) {
        return Device.styles.vendor == "" ? h.toLowerCase() : Device.styles.vendor + h
    }
}, "Static");
Class(function Dev() {
    var e = this;
    var a, c;
    (function() {
        if (Hydra.LOCAL) {
            Hydra.development(true)
        }
    })();

    function d() {
        window.onerror = function(j, h, f) {
            var g = j + " ::: " + h + " : " + f;
            if (c) {
                alert(g)
            }
            if (a) {
                XHR.post(a + "/api/data/debug", b(g), "json")
            }
        }
    }

    function b(f) {
        var g = {};
        g.err = f;
        g.ua = Device.agent;
        g.browser = {
            width: Stage.width,
            height: Stage.height
        };
        return g
    }
    this.alertErrors = function(f) {
        c = true;
        if (typeof f === "string") {
            f = [f]
        }
        for (var g = 0; g < f.length; g++) {
            if (location.href.strpos(f[g])) {
                return d()
            }
        }
    };
    this.postErrors = function(f, h) {
        a = h;
        if (typeof f === "string") {
            f = [f]
        }
        for (var g = 0; g < f.length; g++) {
            if (location.href.strpos(f[g])) {
                return d()
            }
        }
    };
    this.expose = function(f, h, g) {
        if (Hydra.LOCAL || g) {
            window[f] = h
        }
    }
}, "Static");
Class(function Device() {
    var c = this;
    this.agent = navigator.userAgent.toLowerCase();
    var b = (function() {
        var d = window.getComputedStyle(document.documentElement, "");
        var e = (Array.prototype.slice.call(d).join("").match(/-(moz|webkit|ms)-/) || (d.OLink === "" && ["", "o"]))[1];
        var f = ("WebKit|Moz|MS|O").match(new RegExp("(" + e + ")", "i"))[1];
        return {
            unprefixed: false,
            dom: f,
            lowercase: e,
            css: "-" + e + "-",
            js: e[0].toUpperCase() + e.substr(1)
        }
    })();

    function a(g) {
        var f = document.createElement("div"),
            e = "Khtml ms O Moz Webkit".split(" "),
            d = e.length;
        if (g in f.style) {
            return true
        }
        g = g.replace(/^[a-z]/, function(h) {
            return h.toUpperCase()
        });
        while (d--) {
            if (e[d] + g in f.style) {
                return true
            }
        }
        return false
    }
    this.detect = function(e) {
        if (typeof e === "string") {
            e = [e]
        }
        for (var d = 0; d < e.length; d++) {
            if (this.agent.strpos(e[d])) {
                return true
            }
        }
        return false
    };
    this.mobile = (!!("ontouchstart" in window) && this.detect(["ios", "iphone", "ipad", "windows phone", "android", "blackberry"])) ? {} : false;
    if (this.mobile) {
        this.mobile.tablet = window.innerWidth > 1000 || window.innerHeight > 900;
        this.mobile.phone = !this.mobile.tablet
    }
    this.browser = {};
    this.browser.chrome = this.detect("chrome");
    this.browser.safari = !this.browser.chrome && this.detect("safari");
    this.browser.firefox = this.detect("firefox");
    this.browser.ie = (function() {
        if (c.detect("msie")) {
            return true
        }
        if (c.detect("trident") && c.detect("rv:")) {
            return true
        }
    })();
    this.browser.version = (function() {
        try {
            if (c.browser.chrome) {
                return Number(c.agent.split("chrome/")[1].split(".")[0])
            }
            if (c.browser.firefox) {
                return Number(c.agent.split("firefox/")[1].split(".")[0])
            }
            if (c.browser.safari) {
                return Number(c.agent.split("version/")[1].split(".")[0].charAt(0))
            }
            if (c.browser.ie) {
                if (c.detect("msie")) {
                    return Number(c.agent.split("msie ")[1].split(".")[0])
                }
                return Number(c.agent.split("rv:")[1].split(".")[0])
            }
        } catch (d) {
            return -1
        }
    })();
    this.vendor = b.css;
    this.transformProperty = (function() {
        switch (b.lowercase) {
            case "moz":
                return "-moz-transform";
                break;
            case "webkit":
                return "-webkit-transform";
                break;
            case "o":
                return "-o-transform";
                break;
            case "ms":
                return "-ms-transform";
                break;
            default:
                return "transform";
                break
        }
    })();
    this.system = {};
    this.system.retina = window.devicePixelRatio > 1;
    this.system.webworker = typeof window.Worker !== "undefined";
    this.system.offline = typeof window.applicationCache !== "undefined";
    this.system.geolocation = typeof navigator.geolocation !== "undefined";
    this.system.pushstate = typeof window.history.pushState !== "undefined";
    this.system.webcam = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    this.system.language = window.navigator.userLanguage || window.navigator.language;
    this.system.webaudio = typeof window.webkitAudioContext !== "undefined" || typeof window.AudioContent !== "undefined";
    this.system.localStorage = typeof window.localStorage !== "undefined";
    this.system.fullscreen = typeof document[b.lowercase + "CancelFullScreen"] !== "undefined";
    this.system.os = (function() {
        if (c.detect("mac os")) {
            return "mac"
        } else {
            if (c.detect("windows nt 6.3")) {
                return "windows8.1"
            } else {
                if (c.detect("windows nt 6.2")) {
                    return "windows8"
                } else {
                    if (c.detect("windows nt 6.1")) {
                        return "windows7"
                    } else {
                        if (c.detect("windows nt 6.0")) {
                            return "windowsvista"
                        } else {
                            if (c.detect("windows nt 5.1")) {
                                return "windowsxp"
                            } else {
                                if (c.detect("windows")) {
                                    return "windows"
                                } else {
                                    if (c.detect("linux")) {
                                        return "linux"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return "undetected"
    })();
    this.media = {};
    this.media.audio = (function() {
        if (!!document.createElement("audio").canPlayType) {
            return c.detect(["firefox", "opera"]) ? "ogg" : "mp3"
        } else {
            return false
        }
    })();
    this.media.video = (function() {
        var d = document.createElement("video");
        if (!!d.canPlayType) {
            if (Device.mobile) {
                return "mp4"
            }
            if (c.browser.chrome) {
                return "webm"
            }
            if (c.browser.firefox || c.browser.opera) {
                if (d.canPlayType('video/webm; codecs="vorbis,vp8"')) {
                    return "webm"
                }
                return "ogv"
            }
            return "mp4"
        } else {
            return false
        }
    })();
    this.graphics = {};
    this.graphics.webgl = (function() {
        try {
            return !!window.WebGLRenderingContext && !!document.createElement("canvas").getContext("experimental-webgl")
        } catch (d) {}
    })();
    this.graphics.canvas = (function() {
        var d = document.createElement("canvas");
        return d.getContext ? true : false
    })();
    this.styles = {};
    this.styles.filter = a("filter");
    this.styles.vendor = b.unprefixed ? "" : b.js;
    this.styles.vendorTransition = this.styles.vendor.length ? this.styles.vendor + "Transition" : "transition";
    this.styles.vendorTransform = this.styles.vendor.length ? this.styles.vendor + "Transform" : "transform";
    this.tween = {};
    this.tween.transition = a("transition");
    this.tween.css2d = a("transform");
    this.tween.css3d = a("perspective");
    this.tween.complete = (function() {
        if (b.unprefixed) {
            return "transitionend"
        }
        return b.lowercase + "TransitionEnd"
    })();
    this.test = function(d, e) {
        this[d] = e()
    };
    this.openFullscreen = function(d) {
        d = d || __body;
        if (d && c.system.fullscreen) {
            if (d == __body) {
                d.css({
                    top: 0
                })
            }
            d.div[b.lowercase + "RequestFullScreen"]()
        }
    };
    this.closeFullscreen = function() {
        if (c.system.fullscreen) {
            document[b.lowercase + "CancelFullScreen"]()
        }
    };
    this.getFullscreen = function() {
        if (c.browser.firefox) {
            return document.mozFullScreen
        }
        return document[b.lowercase + "IsFullScreen"]
    }
}, "Static");
Class(function Storage() {
    var d = this;
    var c;
    (function() {
        a()
    })();

    function a() {
        if (window.localStorage) {
            try {
                window.localStorage.test = 1;
                window.localStorage.removeItem("test");
                c = true
            } catch (f) {
                c = false
            }
        } else {
            c = false
        }
    }

    function b(j, k, f) {
        var g;
        if (arguments.length > 1 && (k === null || typeof k !== "object")) {
            g = {};
            g.path = "/";
            g.expires = f || 1;
            if (k === null) {
                g.expires = -1
            }
            if (typeof g.expires === "number") {
                var m = g.expires,
                    h = g.expires = new Date();
                h.setDate(h.getDate() + m)
            }
            return (document.cookie = [encodeURIComponent(j), "=", g.raw ? String(k) : encodeURIComponent(String(k)), g.expires ? "; expires=" + g.expires.toUTCString() : "", g.path ? "; path=" + g.path : "", g.domain ? "; domain=" + g.domain : "", g.secure ? "; secure" : ""].join(""))
        }
        g = k || {};
        var e, l = g.raw ? function(n) {
            return n
        } : decodeURIComponent;
        return (e = new RegExp("(?:^|; )" + encodeURIComponent(j) + "=([^;]*)").exec(document.cookie)) ? l(e[1]) : null
    }
    this.setCookie = function(f, g, e) {
        b(f, g, e)
    };
    this.getCookie = function(e) {
        return b(e)
    };
    this.set = function(e, f) {
        if (typeof f === "object") {
            f = JSON.stringify(f)
        }
        if (c) {
            if (typeof f === "null") {
                window.localStorage.removeItem(e)
            } else {
                window.localStorage[e] = f
            }
        } else {
            b(e, f, 365)
        }
    };
    this.get = function(e) {
        var g;
        if (c) {
            g = window.localStorage[e]
        } else {
            g = b(e)
        }
        if (g) {
            var f;
            if (g.charAt) {
                f = g.charAt(0)
            }
            if (f == "{" || f == "[") {
                g = JSON.parse(g)
            }
        }
        return g
    }
}, "Static");
Class(function DistributedWorker(d) {
    Inherit(this, Component);
    var e = this;
    var a, c;
    d = d || 4;
    (function() {})();

    function b() {
        while (c < d) {
            var f = performance.now();
            if (a) {
                a()
            } else {
                return
            }
            c += performance.now() - f
        }
        c = 0
    }
    this.start = function(f) {
        Render.startRender(b);
        a = f;
        c = 0
    };
    this.stop = function() {
        Render.stopRender(b);
        a = null
    };
    this.destroy = function() {
        this.stop();
        return this._destroy()
    };
    this.set("time", function(f) {
        d = f
    });
    this.get("time", function() {
        return d
    })
});
Class(function DynamicObject(a) {
    var c;
    for (var b in a) {
        this[b] = a[b]
    }
    this.tween = function(f, g, h, e, j, d) {
        if (typeof e !== "number") {
            d = j;
            j = e;
            e = 0
        }
        this.stopTween();
        if (typeof d !== "function") {
            d = null
        }
        if (typeof j !== "function") {
            j = null
        }
        c = TweenManager.tween(this, f, g, h, e, d, j);
        return c
    };
    this.stopTween = function() {
        if (c && c.stop) {
            c.stop()
        }
    };
    this.pause = function() {
        if (c && c.pause) {
            c.pause()
        }
    };
    this.resume = function() {
        if (c && c.resume) {
            c.resume()
        }
    };
    this.copy = function(e) {
        var f = e && e.get ? e.get() : new DynamicObject();
        for (var d in this) {
            if (typeof this[d] !== "function" && typeof this[d] !== "object") {
                f[d] = this[d]
            }
        }
        return f
    };
    this.clear = function() {
        for (var d in this) {
            if (typeof this[d] !== "function") {
                delete this[d]
            }
        }
        return this
    }
});
Class(function ObjectPool(b, d) {
    Inherit(this, Component);
    var c = this;
    var a = [];
    this.limit = Math.round(d * 1.25);
    (function() {
        if (b) {
            d = d || 10;
            b = b || Object;
            for (var e = 0; e < d; e++) {
                a.push(new b())
            }
        }
    })();
    this.get = function() {
        if (!a.length && a.length < c.limit) {
            a.push(new b())
        }
        return a.shift()
    };
    this.empty = function() {
        a = []
    };
    this.put = function(e) {
        if (e) {
            a.push(e)
        }
    };
    this.insert = function(f) {
        if (typeof f.push === "undefined") {
            f = [f]
        }
        for (var e = 0; e < f.length; e++) {
            a.push(f[e])
        }
    };
    this.destroy = function() {
        for (var e = 0; e < a.length; e++) {
            if (a[e].destroy) {
                a[e].destroy()
            }
        }
        a = null;
        return this._destroy()
    }
});
Class(function LinkedList() {
    var a = LinkedList.prototype;
    this.length = 0;
    this.first = null;
    this.last = null;
    this.current = null;
    this.prev = null;
    if (typeof a.push !== "undefined") {
        return
    }
    a.push = function(b) {
        if (!this.first) {
            this.first = b;
            this.last = b;
            b.__prev = b;
            b.__next = b
        } else {
            b.__next = this.first;
            b.__prev = this.last;
            this.last.__next = b;
            this.last = b
        }
        this.length++
    };
    a.remove = function(b) {
        if (!b || !b.__next) {
            return
        }
        if (this.length <= 1) {
            this.empty()
        } else {
            if (b == this.first) {
                this.first = b.__next;
                this.last.__next = this.first;
                this.first.__prev = this.last
            } else {
                if (b == this.last) {
                    this.last = b.__prev;
                    this.last.__next = this.first;
                    this.first.__prev = this.last
                } else {
                    b.__prev.__next = b.__next;
                    b.__next.__prev = b.__prev
                }
            }
            this.length--
        }
        b.__prev = null;
        b.__next = null
    };
    a.empty = function() {
        this.first = null;
        this.last = null;
        this.current = null;
        this.prev = null;
        this.length = 0
    };
    a.start = function() {
        this.current = this.first;
        this.prev = this.current;
        return this.current
    };
    a.next = function() {
        if (!this.current) {
            return
        }
        this.current = this.current.__next;
        if (this.length == 1 || this.prev.__next == this.first) {
            return
        }
        this.prev = this.current;
        return this.current
    };
    a.destroy = function() {
        Utils.nullObject(this);
        return null
    }
});
Class(function Mouse() {
    var c = this;
    var a;
    this.x = 0;
    this.y = 0;
    this.autoPreventClicks = false;

    function b(f) {
        c.ready = true;
        var d = Utils.touchEvent(f);
        c.x = d.x;
        c.y = d.y
    }
    this.capture = function(d, e) {
        if (a) {
            return false
        }
        a = true;
        c.x = d || 0;
        c.y = e || 0;
        if (!Device.mobile) {
            __window.bind("mousemove", b)
        } else {
            __window.bind("touchmove", b);
            __window.bind("touchstart", b)
        }
    };
    this.stop = function() {
        if (!a) {
            return false
        }
        a = false;
        c.x = 0;
        c.y = 0;
        if (!Device.mobile) {
            __window.unbind("mousemove", b)
        } else {
            __window.unbind("touchmove", b);
            __window.unbind("touchstart", b)
        }
    };
    this.preventClicks = function() {
        c._preventClicks = true;
        setTimeout(function() {
            c._preventClicks = false
        }, 500)
    };
    this.preventFireAfterClick = function() {
        c._preventFire = true
    }
}, "Static");
Class(function HydraEvents() {
    var b = [];
    var a = {};
    this.BROWSER_FOCUS = "hydra_focus";
    this.HASH_UPDATE = "hydra_hash_update";
    this.COMPLETE = "hydra_complete";
    this.PROGRESS = "hydra_progress";
    this.UPDATE = "hydra_update";
    this.LOADED = "hydra_loaded";
    this.END = "hydra_end";
    this.FAIL = "hydra_fail";
    this.SELECT = "hydra_select";
    this.ERROR = "hydra_error";
    this.READY = "hydra_ready";
    this.RESIZE = "hydra_resize";
    this.CLICK = "hydra_click";
    this.HOVER = "hydra_hover";
    this.MESSAGE = "hydra_message";
    this.ORIENTATION = "orientation";
    this.BACKGROUND = "background";
    this.BACK = "hydra_back";
    this.PREVIOUS = "hydra_previous";
    this.NEXT = "hydra_next";
    this.RELOAD = "hydra_reload";
    this.FULLSCREEN = "hydra_fullscreen";
    this._checkDefinition = function(c) {
        if (typeof c == "undefined") {
            throw "Undefined event"
        }
    };
    this._addEvent = function(f, g, c) {
        if (this._checkDefinition) {
            this._checkDefinition(f)
        }
        var d = new Object();
        d.evt = f;
        d.object = c;
        d.callback = g;
        b.push(d)
    };
    this._removeEvent = function(c, e) {
        if (this._checkDefinition) {
            this._checkDefinition(c)
        }
        for (var d = b.length - 1; d > -1; d--) {
            if (b[d].evt == c && b[d].callback == e) {
                b[d] = null;
                b.splice(d, 1)
            }
        }
    };
    this._destroyEvents = function(c) {
        for (var d = b.length - 1; d > -1; d--) {
            if (b[d].object == c) {
                b[d] = null;
                b.splice(d, 1)
            }
        }
    };
    this._fireEvent = function(c, f) {
        if (this._checkDefinition) {
            this._checkDefinition(c)
        }
        var e = true;
        f = f || a;
        f.cancel = function() {
            e = false
        };
        for (var d = 0; d < b.length; d++) {
            if (b[d].evt == c) {
                if (e) {
                    b[d].callback(f)
                } else {
                    return false
                }
            }
        }
    };
    this._consoleEvents = function() {
        console.log(b)
    };
    this.createLocalEmitter = function(d) {
        var c = new HydraEvents();
        d.addEvent = c._addEvent;
        d.removeEvent = c._removeEvent;
        d.fireEvent = c._fireEvent
    }
}, "Static");
Class(function Events(c) {
    this.events = {};
    var b = {};
    var a = {};
    this.events.subscribe = function(d, e) {
        HydraEvents._addEvent(d, !!e._fire ? e._fire : e, c);
        return e
    };
    this.events.unsubscribe = function(d, e) {
        HydraEvents._removeEvent(d, !!e._fire ? e._fire : e)
    };
    this.events.fire = function(d, f, e) {
        f = f || a;
        HydraEvents._checkDefinition(d);
        if (b[d]) {
            f.target = f.target || c;
            b[d](f);
            f.target = null
        } else {
            if (!e) {
                HydraEvents._fireEvent(d, f)
            }
        }
    };
    this.events.add = function(d, e) {
        HydraEvents._checkDefinition(d);
        b[d] = !!e._fire ? e._fire : e;
        return e
    };
    this.events.remove = function(d) {
        HydraEvents._checkDefinition(d);
        if (b[d]) {
            delete b[d]
        }
    };
    this.events.bubble = function(e, d) {
        HydraEvents._checkDefinition(d);
        var f = this;
        e.events.add(d, function(g) {
            f.fire(d, g)
        })
    };
    this.events.scope = function(d) {
        c = d
    };
    this.events.destroy = function() {
        HydraEvents._destroyEvents(c);
        b = null;
        return null
    }
});
Class(function AssetLoader(_assets) {
    Inherit(this, Component);
    var _this = this;
    var _total = 0;
    var _loaded = 0;
    var _added = 0;
    var _triggered = 0;
    var _lastTriggered = 0;
    var _queue, _qLoad, _loaded;
    var _output, _loadedFiles;
    (function() {
        _queue = [];
        _loadedFiles = [];
        prepareAssets();
        setTimeout(startLoading, 10)
    })();

    function prepareAssets() {
        for (var i = 0; i < _assets.length; i++) {
            if (typeof _assets[i] !== "undefined") {
                _total++;
                _queue.push(_assets[i])
            }
        }
    }

    function startLoading() {
        _qLoad = Math.round(_total * 0.5);
        for (var i = 0; i < _qLoad; i++) {
            loadAsset(_queue[i])
        }
    }

    function missingFiles() {
        if (_queue) {
            var missing = [];
            for (var i = 0; i < _queue.length; i++) {
                var loaded = false;
                for (var j = 0; j < _loadedFiles.length; j++) {
                    if (_loadedFiles[j] == _queue[i]) {
                        loaded = true
                    }
                }
                if (!loaded) {
                    missing.push(_queue[i])
                }
            }
            if (missing.length) {
                console.log("AssetLoader Files Failed To Load:");
                console.log(missing)
            }
        }
    }

    function loadAsset(asset) {
        if (asset) {
            var name = asset.split("/");
            name = name[name.length - 1];
            var split = name.split(".");
            var ext = split[split.length - 1].split("?")[0];
            switch (ext) {
                case "html":
                    XHR.get(asset, function(contents) {
                        Hydra.HTML[split[0]] = contents;
                        assetLoaded(asset)
                    }, "text");
                    break;
                case "js":
                case "php":
                case undefined:
                    XHR.get(asset, function(script) {
                        script = script.replace("use strict", "");
                        eval.call(window, script);
                        assetLoaded(asset)
                    }, "text");
                    break;
                case "csv":
                case "json":
                    XHR.get(asset, function(contents) {
                        Hydra.JSON[split[0]] = contents;
                        assetLoaded(asset)
                    }, ext == "csv" ? "text" : null);
                    break;
                case "fs":
                case "vs":
                case "frag":
                case "vert":
                    XHR.get(asset, function(contents) {
                        Hydra.SHADERS[split[0] + "." + ext] = contents;
                        assetLoaded(asset)
                    }, "text");
                    break;
                default:
                    var image = new Image();
                    image.src = asset;
                    image.onload = function() {
                        assetLoaded(asset)
                    };
                    break
            }
        }
    }

    function checkQ() {
        if (_loaded == _qLoad && _loaded < _total) {
            var start = _qLoad;
            _qLoad *= 2;
            for (var i = start; i < _qLoad; i++) {
                if (_queue[i]) {
                    loadAsset(_queue[i])
                }
            }
        }
    }

    function assetLoaded(asset) {
        if (_queue) {
            _loaded++;
            _this.events.fire(HydraEvents.PROGRESS, {
                percent: _loaded / _total
            });
            _loadedFiles.push(asset);
            clearTimeout(_output);
            checkQ();
            if (_loaded == _total) {
                _this.complete = true;
                Render.nextFrame(function() {
                    if (_this.events) {
                        _this.events.fire(HydraEvents.COMPLETE)
                    }
                })
            } else {
                _output = setTimeout(missingFiles, 5000)
            }
        }
    }
    this.add = function(num) {
        _total += num;
        _added += num
    };
    this.trigger = function(num) {
        num = num || 1;
        for (var i = 0; i < num; i++) {
            assetLoaded("trigger")
        }
    };
    this.triggerPercent = function(percent, num) {
        num = num || _added;
        var trigger = Math.ceil(num * percent);
        if (trigger > _lastTriggered) {
            this.trigger(trigger - _lastTriggered)
        }
        _lastTriggered = trigger
    };
    this.destroy = function() {
        _assets = null;
        _loaded = null;
        _queue = null;
        _loaded = null;
        _qLoad = null;
        return this._destroy()
    }
});
Class(function RenderPerformance() {
    Inherit(this, Component);
    var c = this;
    var b;
    var a = [];
    this.enabled = true;
    this.pastFrames = 60;
    this.time = function() {
        if (!this.enabled) {
            return
        }
        if (!b) {
            b = performance.now()
        } else {
            var f = performance.now() - b;
            b = null;
            a.unshift(f);
            if (a.length > this.pastFrames) {
                a.pop()
            }
            this.average = 0;
            var d = a.length;
            for (var e = 0; e < d; e++) {
                this.average += a[e]
            }
            this.average /= d
        }
    };
    this.clear = function() {
        a.length = 0
    };
    this.dump = function() {
        console.log(a)
    };
    this.get("median", function() {
        a.sort(function(e, d) {
            return e - d
        });
        return a[~~(a.length / 2)]
    })
});
Class(function Render() {
    var h = this;
    var e, l, g, a;
    var d = [];
    var k = [];
    var n = new LinkedList();
    var m = new LinkedList();
    var f = n;
    (function() {
        requestAnimationFrame(c);
        Hydra.ready(b)
    })();

    function b() {
        setTimeout(function() {
            if (!l) {
                window.requestAnimationFrame = function(o) {
                    setTimeout(o, 1000 / 60)
                };
                c()
            }
        }, 250)
    }

    function c() {
        var p = Date.now();
        var r = 0;
        var q = 60;
        if (l) {
            r = p - l;
            q = 1000 / r
        }
        l = p;
        h.FPS = q;
        for (var o = k.length - 1; o > -1; o--) {
            if (k[o]) {
                k[o](p, q, r)
            }
        }
        if (g && q < g) {
            for (o = d.length - 1; o > -1; o--) {
                if (d[o]) {
                    d[o](q)
                } else {
                    d.splice(o, 1)
                }
            }
        }
        if (f.length) {
            j()
        }
        requestAnimationFrame(c)
    }

    function j() {
        var o = f;
        f = f == n ? m : n;
        var p = o.start();
        while (p) {
            p();
            p = o.next()
        }
        o.empty()
    }
    this.startRender = this.start = function(q) {
        var p = true;
        var o = k.length - 1;
        if (k.indexOf(q) == -1) {
            k.push(q)
        }
    };
    this.stopRender = this.stop = function(p) {
        var o = k.indexOf(p);
        if (o > -1) {
            k.splice(o, 1)
        }
    };
    this.addThreshold = function(o, p) {
        g = o;
        if (d.indexOf(p) == -1 && p) {
            d.push(p)
        }
    };
    this.removeThreshold = function(p) {
        if (p) {
            var o = d.indexOf(p);
            if (o > -1) {
                d.splice(o, 1)
            }
        } else {
            d = []
        }
        g = null
    };
    this.startTimer = function(o) {
        a = o || "Timer";
        if (console.time && !window._NODE_) {
            console.time(a)
        } else {
            e = Date.now()
        }
    };
    this.stopTimer = function() {
        if (console.time && !window._NODE_) {
            console.timeEnd(a)
        } else {
            console.log("Render " + a + ": " + (Date.now() - e))
        }
    };
    this.nextFrame = function(o) {
        f.push(o)
    };
    this.setupTween = function(o) {
        h.nextFrame(function() {
            h.nextFrame(o)
        })
    }
}, "Static");
Class(function XHR() {
    var c = this;
    var b;

    function a(e, f) {
        if (typeof f === "object") {
            for (var d in f) {
                var g = e + "[" + d + "]";
                if (typeof f[d] === "object") {
                    a(g, f[d])
                } else {
                    b.push(g + "=" + f[d])
                }
            }
        } else {
            b.push(e + "=" + f)
        }
    }
    this.get = function(e, h, k, g) {
        if (typeof h === "function") {
            g = k;
            k = h;
            h = null
        } else {
            if (typeof h === "object") {
                var d = "?";
                for (var f in h) {
                    d += f + "=" + h[f] + "&"
                }
                d = d.slice(0, -1);
                e += d
            }
        }
        var j = new XMLHttpRequest();
        j.open("GET", e, true);
        j.send();
        j.onreadystatechange = function() {
            if (j.readyState == 4 && j.status == 200) {
                if (typeof k === "function") {
                    var l = j.responseText;
                    if (g == "text") {
                        k(l)
                    } else {
                        try {
                            Render.nextFrame(function() {
                                k(JSON.parse(l))
                            })
                        } catch (m) {
                            console.error("XHR Parse: " + e + " : " + m.message)
                        }
                    }
                }
                j = null
            }
        }
    };
    this.post = function(d, g, k, f, j) {
        if (typeof g === "function") {
            j = f;
            f = k;
            k = g;
            g = null
        } else {
            if (typeof g === "object") {
                if (k == "json" || f == "json" || j == "json") {
                    g = JSON.stringify(g)
                } else {
                    b = new Array();
                    for (var e in g) {
                        a(e, g[e])
                    }
                    g = b.join("&");
                    g = g.replace(/\[/g, "%5B");
                    g = g.replace(/\]/g, "%5D");
                    b = null
                }
            }
        }
        var h = new XMLHttpRequest();
        h.open("POST", d, true);
        switch (j) {
            case "upload":
                j = "application/upload";
                break;
            default:
                j = "application/x-www-form-urlencoded";
                break
        }
        h.setRequestHeader("Content-type", j);
        h.onreadystatechange = function() {
            if (h.readyState == 4 && h.status == 200) {
                if (typeof k === "function") {
                    var l = h.responseText;
                    if (f == "text") {
                        k(l)
                    } else {
                        try {
                            Render.nextFrame(function() {
                                k(JSON.parse(l))
                            })
                        } catch (m) {
                            console.error("XHR Parse: " + d + " : " + m.message)
                        }
                    }
                }
                h = null
            }
        };
        h.send(g)
    }
}, "Static");
Class(function Color(b) {
    Inherit(this, Component);
    var f = this;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    (function() {
        e(b)
    })();

    function e(g) {
        if (g instanceof Color) {
            d(g)
        } else {
            if (typeof g === "number") {
                c(g)
            } else {
                c(Number("0x" + g.slice(1)))
            }
        }
    }

    function d(g) {
        f.r = g.r;
        f.g = g.g;
        f.b = g.b
    }

    function c(g) {
        g = Math.floor(g);
        f.r = (g >> 16 & 255) / 255;
        f.g = (g >> 8 & 255) / 255;
        f.b = (g & 255) / 255
    }

    function a(j, h, g) {
        if (g < 0) {
            g += 1
        }
        if (g > 1) {
            g -= 1
        }
        if (g < 1 / 6) {
            return j + (h - j) * 6 * g
        }
        if (g < 1 / 2) {
            return h
        }
        if (g < 2 / 3) {
            return j + (h - j) * 6 * (2 / 3 - g)
        }
        return j
    }
    this.set = function(g) {
        e(g);
        return this
    };
    this.setRGB = function(k, j, h) {
        this.r = k;
        this.g = j;
        this.b = h;
        return this
    };
    this.setHSL = function(k, j, g) {
        if (j === 0) {
            this.r = this.g = this.b = g
        } else {
            var n = g <= 0.5 ? g * (1 + j) : g + j - (g * j);
            var m = (2 * g) - n;
            this.r = a(m, n, k + 1 / 3);
            this.g = a(m, n, k);
            this.b = a(m, n, k - 1 / 3)
        }
        return this
    };
    this.getStyle = function() {
        return "rgb(" + ((this.r * 255) | 0) + "," + ((this.g * 255) | 0) + "," + ((this.b * 255) | 0) + ")"
    };
    this.getHex = function() {
        return (this.r * 255) << 16 ^ (this.g * 255) << 8 ^ (this.b * 255) << 0
    };
    this.getHexString = function() {
        return "#" + ("000000" + this.getHex().toString(16)).slice(-6)
    };
    this.add = function(g) {
        this.r += g.r;
        this.g += g.g;
        this.b += g.b
    };
    this.mix = function(g, h) {
        this.r = this.r * (1 - h) + (g.r * h);
        this.g = this.g * (1 - h) + (g.g * h);
        this.b = this.b * (1 - h) + (g.b * h)
    };
    this.addScalar = function(g) {
        this.r += g;
        this.g += g;
        this.b += g
    };
    this.multiply = function(g) {
        this.r *= g.r;
        this.g *= g.g;
        this.b *= g.b
    };
    this.multiplyScalar = function(g) {
        this.r *= g;
        this.g *= g;
        this.b *= g
    };
    this.clone = function() {
        return new Color().setRGB(this.r, this.g, this.b)
    }
});
Class(function Noise() {
    var f = this;

    function e(n, p, o) {
        this.x = n;
        this.y = p;
        this.z = o
    }
    e.prototype.dot2 = function(n, o) {
        return this.x * n + this.y * o
    };
    e.prototype.dot3 = function(n, p, o) {
        return this.x * n + this.y * p + this.z * o
    };
    var k = [new e(1, 1, 0), new e(-1, 1, 0), new e(1, -1, 0), new e(-1, -1, 0), new e(1, 0, 1), new e(-1, 0, 1), new e(1, 0, -1), new e(-1, 0, -1), new e(0, 1, 1), new e(0, -1, 1), new e(0, 1, -1), new e(0, -1, -1)];
    var b = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    var j = new Array(512);
    var c = new Array(512);
    f.seed = function(n) {
        if (n > 0 && n < 1) {
            n *= 65536
        }
        n = Math.floor(n);
        if (n < 256) {
            n |= n << 8
        }
        for (var p = 0; p < 256; p++) {
            var o;
            if (p & 1) {
                o = b[p] ^ (n & 255)
            } else {
                o = b[p] ^ ((n >> 8) & 255)
            }
            j[p] = j[p + 256] = o;
            c[p] = c[p + 256] = k[o % 12]
        }
    };
    f.seed(0);
    var m = 0.5 * (Math.sqrt(3) - 1);
    var d = (3 - Math.sqrt(3)) / 6;
    var l = 1 / 3;
    var a = 1 / 6;
    f.simplex2 = function(I, r) {
        var x, v, u;
        var B = (I + r) * m;
        var H = Math.floor(I + B);
        var G = Math.floor(r + B);
        var A = (H + G) * d;
        var L = I - H + A;
        var q = r - G + A;
        var F, n;
        if (L > q) {
            F = 1;
            n = 0
        } else {
            F = 0;
            n = 1
        }
        var K = L - F + d;
        var p = q - n + d;
        var J = L - 1 + 2 * d;
        var o = q - 1 + 2 * d;
        H &= 255;
        G &= 255;
        var E = c[H + j[G]];
        var D = c[H + F + j[G + n]];
        var C = c[H + 1 + j[G + 1]];
        var z = 0.5 - L * L - q * q;
        if (z < 0) {
            x = 0
        } else {
            z *= z;
            x = z * z * E.dot2(L, q)
        }
        var y = 0.5 - K * K - p * p;
        if (y < 0) {
            v = 0
        } else {
            y *= y;
            v = y * y * D.dot2(K, p)
        }
        var w = 0.5 - J * J - o * o;
        if (w < 0) {
            u = 0
        } else {
            w *= w;
            u = w * w * C.dot2(J, o)
        }
        return 70 * (x + v + u)
    };
    f.simplex3 = function(P, E, A) {
        var H, G, F, D;
        var S = (P + E + A) * l;
        var W = Math.floor(P + S);
        var U = Math.floor(E + S);
        var T = Math.floor(A + S);
        var R = (W + U + T) * a;
        var z = P - W + R;
        var n = E - U + R;
        var Q = A - T + R;
        var p, X, C;
        var o, V, B;
        if (z >= n) {
            if (n >= Q) {
                p = 1;
                X = 0;
                C = 0;
                o = 1;
                V = 1;
                B = 0
            } else {
                if (z >= Q) {
                    p = 1;
                    X = 0;
                    C = 0;
                    o = 1;
                    V = 0;
                    B = 1
                } else {
                    p = 0;
                    X = 0;
                    C = 1;
                    o = 1;
                    V = 0;
                    B = 1
                }
            }
        } else {
            if (n < Q) {
                p = 0;
                X = 0;
                C = 1;
                o = 0;
                V = 1;
                B = 1
            } else {
                if (z < Q) {
                    p = 0;
                    X = 1;
                    C = 0;
                    o = 0;
                    V = 1;
                    B = 1
                } else {
                    p = 0;
                    X = 1;
                    C = 0;
                    o = 1;
                    V = 1;
                    B = 0
                }
            }
        }
        var y = z - p + a;
        var aa = n - X + a;
        var O = Q - C + a;
        var x = z - o + 2 * a;
        var Z = n - V + 2 * a;
        var N = Q - B + 2 * a;
        var v = z - 1 + 3 * a;
        var Y = n - 1 + 3 * a;
        var M = Q - 1 + 3 * a;
        W &= 255;
        U &= 255;
        T &= 255;
        var w = c[W + j[U + j[T]]];
        var u = c[W + p + j[U + X + j[T + C]]];
        var r = c[W + o + j[U + V + j[T + B]]];
        var q = c[W + 1 + j[U + 1 + j[T + 1]]];
        var L = 0.6 - z * z - n * n - Q * Q;
        if (L < 0) {
            H = 0
        } else {
            L *= L;
            H = L * L * w.dot3(z, n, Q)
        }
        var K = 0.6 - y * y - aa * aa - O * O;
        if (K < 0) {
            G = 0
        } else {
            K *= K;
            G = K * K * u.dot3(y, aa, O)
        }
        var J = 0.6 - x * x - Z * Z - N * N;
        if (J < 0) {
            F = 0
        } else {
            J *= J;
            F = J * J * r.dot3(x, Z, N)
        }
        var I = 0.6 - v * v - Y * Y - M * M;
        if (I < 0) {
            D = 0
        } else {
            I *= I;
            D = I * I * q.dot3(v, Y, M)
        }
        return 32 * (H + G + F + D)
    };

    function h(n) {
        return n * n * n * (n * (n * 6 - 15) + 10)
    }

    function g(o, n, p) {
        return (1 - p) * o + p * n
    }
    f.perlin = function(n) {
        return f.perlin2(n, 0)
    };
    f.perlin2 = function(v, r) {
        var q = Math.floor(v),
            o = Math.floor(r);
        v = v - q;
        r = r - o;
        q = q & 255;
        o = o & 255;
        var p = c[q + j[o]].dot2(v, r);
        var n = c[q + j[o + 1]].dot2(v, r - 1);
        var t = c[q + 1 + j[o]].dot2(v - 1, r);
        var s = c[q + 1 + j[o + 1]].dot2(v - 1, r - 1);
        var w = h(v);
        return g(g(p, t, w), g(n, s, w), h(r))
    };
    f.perlin3 = function(D, B, A) {
        var r = Math.floor(D),
            p = Math.floor(B),
            n = Math.floor(A);
        D = D - r;
        B = B - p;
        A = A - n;
        r = r & 255;
        p = p & 255;
        n = n & 255;
        var J = c[r + j[p + j[n]]].dot3(D, B, A);
        var I = c[r + j[p + j[n + 1]]].dot3(D, B, A - 1);
        var t = c[r + j[p + 1 + j[n]]].dot3(D, B - 1, A);
        var s = c[r + j[p + 1 + j[n + 1]]].dot3(D, B - 1, A - 1);
        var q = c[r + 1 + j[p + j[n]]].dot3(D - 1, B, A);
        var o = c[r + 1 + j[p + j[n + 1]]].dot3(D - 1, B, A - 1);
        var F = c[r + 1 + j[p + 1 + j[n]]].dot3(D - 1, B - 1, A);
        var C = c[r + 1 + j[p + 1 + j[n + 1]]].dot3(D - 1, B - 1, A - 1);
        var H = h(D);
        var G = h(B);
        var E = h(A);
        return g(g(g(J, q, H), g(I, o, H), E), g(g(t, F, H), g(s, C, H), E), G)
    }
}, "Static");
Class(function Matrix4() {
    var d = this;
    var b = Matrix4.prototype;
    this.type = "matrix4";
    this.data = new Float32Array(16);
    (function() {
        a()
    })();

    function a(e) {
        var f = e || d.data;
        f[0] = 1, f[4] = 0, f[8] = 0, f[12] = 0;
        f[1] = 0, f[5] = 1, f[9] = 0, f[13] = 0;
        f[2] = 0, f[6] = 0, f[10] = 1, f[14] = 0;
        f[3] = 0, f[7] = 0, f[11] = 0, f[15] = 1
    }

    function c(e) {
        e = Math.abs(e) < 0.000001 ? 0 : e;
        return e
    }
    if (typeof b.identity !== "undefined") {
        return
    }
    b.identity = function() {
        a();
        return this
    };
    b.transformVector = function(g, h) {
        var k = this.data;
        var e = g.x,
            l = g.y,
            j = g.z,
            f = g.w;
        h = h || g;
        h.x = k[0] * e + k[4] * l + k[8] * j + k[12] * f;
        h.y = k[1] * e + k[5] * l + k[9] * j + k[13] * f;
        h.z = k[2] * e + k[6] * l + k[10] * j + k[14] * f;
        return h
    };
    b.multiply = function(M, N) {
        var P = this.data;
        var O = M.data || M;
        var L, K, J, I, H, G, F, E, D, C, r, q, p, o, n, l;
        var B, A, z, y, x, w, v, u, t, s, k, j, h, g, f, e;
        L = P[0], K = P[1], J = P[2], I = P[3];
        H = P[4], G = P[5], F = P[6], E = P[7];
        D = P[8], C = P[9], r = P[10], q = P[11];
        p = P[12], o = P[13], n = P[14], l = P[15];
        B = O[0], A = O[1], z = O[2], y = O[3];
        x = O[4], w = O[5], v = O[6], u = O[7];
        t = O[8], s = O[9], k = O[10], j = O[11];
        h = O[12], g = O[13], f = O[14], e = O[15];
        P[0] = L * B + H * A + D * z + p * y;
        P[1] = K * B + G * A + C * z + o * y;
        P[2] = J * B + F * A + r * z + n * y;
        P[3] = I * B + E * A + q * z + l * y;
        P[4] = L * x + H * w + D * v + p * u;
        P[5] = K * x + G * w + C * v + o * u;
        P[6] = J * x + F * w + r * v + n * u;
        P[7] = I * x + E * w + q * v + l * u;
        P[8] = L * t + H * s + D * k + p * j;
        P[9] = K * t + G * s + C * k + o * j;
        P[10] = J * t + F * s + r * k + n * j;
        P[11] = I * t + E * s + q * k + l * j;
        P[12] = L * h + H * g + D * f + p * e;
        P[13] = K * h + G * g + C * f + o * e;
        P[14] = J * h + F * g + r * f + n * e;
        P[15] = I * h + E * g + q * f + l * e;
        return this
    };
    b.setTRS = function(p, o, n, g, f, e, w, v, u, l) {
        l = l || this;
        var s = l.data;
        a(l);
        var k = Math.sin(g);
        var t = Math.cos(g);
        var j = Math.sin(f);
        var r = Math.cos(f);
        var h = Math.sin(e);
        var q = Math.cos(e);
        s[0] = (r * q + j * k * h) * w;
        s[1] = (-r * h + j * k * q) * w;
        s[2] = j * t * w;
        s[4] = h * t * v;
        s[5] = q * t * v;
        s[6] = -k * v;
        s[8] = (-j * q + r * k * h) * u;
        s[9] = (h * j + r * k * q) * u;
        s[10] = r * t * u;
        s[12] = p;
        s[13] = o;
        s[14] = n;
        return l
    };
    b.setScale = function(j, h, f, e) {
        e = e || this;
        var g = e.data || e;
        a(e);
        g[0] = j, g[5] = h, g[10] = f;
        return e
    };
    b.setTranslation = function(g, f, j, e) {
        e = e || this;
        var h = e.data || e;
        a(e);
        h[12] = g, h[13] = f, h[14] = j;
        return e
    };
    b.setRotation = function(g, f, e, j) {
        j = j || this;
        var n = j.data || j;
        a(j);
        var q = Math.sin(g);
        var l = Math.cos(g);
        var p = Math.sin(f);
        var k = Math.cos(f);
        var o = Math.sin(e);
        var h = Math.cos(e);
        n[0] = k * h + p * q * o;
        n[1] = -k * o + p * q * h;
        n[2] = p * l;
        n[4] = o * l;
        n[5] = h * l;
        n[6] = -q;
        n[8] = -p * h + k * q * o;
        n[9] = o * p + k * q * h;
        n[10] = k * l;
        return j
    };
    b.setLookAt = function(j, e, h, g) {
        g = g || this;
        var l = g.data || g;
        var k = D3.m4v31;
        var r = D3.m4v32;
        var q = D3.m4v33;
        k.subVectors(e, j).normalize();
        r.cross(k, h).normalize();
        q.cross(r, k);
        l[0] = r.x;
        l[1] = q.x;
        l[2] = -k.x;
        l[3] = 0;
        l[4] = r.y;
        l[5] = q.y;
        l[6] = -k.y;
        l[7] = 0;
        l[8] = r.z;
        l[9] = q.z;
        l[10] = -k.z;
        l[11] = 0;
        l[12] = 0;
        l[13] = 0;
        l[14] = 0;
        l[15] = 1;
        var p = -j.x;
        var o = -j.y;
        var n = -j.z;
        l[12] += l[0] * p + l[4] * o + l[8] * n;
        l[13] += l[1] * p + l[5] * o + l[9] * n;
        l[14] += l[2] * p + l[6] * o + l[10] * n;
        l[15] += l[3] * p + l[7] * o + l[11] * n;
        return this
    };
    b.setPerspective = function(g, e, k, h, f) {
        g = Math.PI * g / 180 / 2;
        f = f || this;
        var l = f.data || f;
        var o = Math.sin(g);
        var n = 1 / (h - k);
        var j = Math.cos(g) / o;
        l[0] = j / e;
        l[1] = 0;
        l[2] = 0;
        l[3] = 0;
        l[4] = 0;
        l[5] = j;
        l[6] = 0;
        l[7] = 0;
        l[8] = 0;
        l[9] = 0;
        l[10] = -(h + k) * n;
        l[11] = -1;
        l[12] = 0;
        l[13] = 0;
        l[14] = -2 * k * h * n;
        l[15] = 0;
        return this
    };
    b.perspective = function(g, f, h, e) {
        this.setPerspective(g, f, h, e, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    b.lookAt = function(g, f, e) {
        this.setLookAt(g, f, e, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    b.translate = function(f, e, g) {
        this.setTranslation(f, e, g, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    b.rotate = function(g, f, e) {
        this.setRotation(g, f, e, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    b.scale = function(g, f, e) {
        this.setScale(g, f, e, Matrix4.__TEMP__);
        return this.multiply(Matrix4.__TEMP__)
    };
    b.copyTo = function(f) {
        var g = this.data;
        var e = f.data || f;
        for (var h = 0; h < 16; h++) {
            e[h] = g[h]
        }
        return f
    };
    b.copyRotationTo = function(f) {
        var g = this.data;
        var e = f.data || f;
        e[0] = g[0];
        e[1] = g[1];
        e[2] = g[2];
        e[3] = g[4];
        e[4] = g[5];
        e[5] = g[6];
        e[6] = g[8];
        e[7] = g[9];
        e[8] = g[10];
        return f
    };
    b.copyPosition = function(e) {
        var g = this.data;
        var f = e.data || e;
        g[12] = f[12];
        g[13] = f[13];
        g[14] = f[14];
        return this
    };
    b.getCSS = function() {
        var e = this.data;
        return "matrix3d(" + c(e[0]) + "," + c(e[1]) + "," + c(e[2]) + "," + c(e[3]) + "," + c(e[4]) + "," + c(e[5]) + "," + c(e[6]) + "," + c(e[7]) + "," + c(e[8]) + "," + c(e[9]) + "," + c(e[10]) + "," + c(e[11]) + "," + c(e[12]) + "," + c(e[13]) + "," + c(e[14]) + "," + c(e[15]) + ")"
    };
    b.extractPosition = function(e) {
        e = e || new Vector3();
        var f = this.data;
        e.set(f[12], f[13], f[14]);
        return e
    };
    b.determinant = function() {
        var e = this.data;
        return e[0] * (e[5] * e[10] - e[9] * e[6]) + e[4] * (e[9] * e[2] - e[1] * e[10]) + e[8] * (e[1] * e[6] - e[5] * e[2])
    };
    b.inverse = function(h) {
        var p = this.data;
        var r = (h) ? h.data || h : this.data;
        var n = this.determinant();
        if (Math.abs(n) < 0.0001) {
            console.warn("Attempt to inverse a singular Matrix4. ", this.data);
            console.trace();
            return h
        }
        var g = p[0],
            v = p[4],
            s = p[8],
            l = p[12],
            f = p[1],
            u = p[5],
            q = p[9],
            k = p[13],
            e = p[2],
            t = p[6],
            o = p[10],
            j = p[14];
        n = 1 / n;
        r[0] = (u * o - q * t) * n;
        r[1] = (s * t - v * o) * n;
        r[2] = (v * q - s * u) * n;
        r[4] = (q * e - f * o) * n;
        r[5] = (g * o - s * e) * n;
        r[6] = (s * f - g * q) * n;
        r[8] = (f * t - u * e) * n;
        r[9] = (v * e - g * t) * n;
        r[10] = (g * u - v * f) * n;
        r[12] = -(l * r[0] + k * r[4] + j * r[8]);
        r[13] = -(l * r[1] + k * r[5] + j * r[9]);
        r[14] = -(l * r[2] + k * r[6] + j * r[10]);
        return h
    };
    b.transpose = function(h) {
        var k = this.data;
        var n = h ? h.data || h : this.data;
        var g = k[0],
            r = k[4],
            o = k[8],
            f = k[1],
            q = k[5],
            l = k[9],
            e = k[2],
            p = k[6],
            j = k[10];
        n[0] = g;
        n[1] = r;
        n[2] = o;
        n[4] = f;
        n[5] = q;
        n[6] = l;
        n[8] = e;
        n[9] = p;
        n[10] = j
    }
});
Matrix4.__TEMP__ = new Matrix4().data;
Class(function Vector2(c, a) {
    var d = this;
    var b = Vector2.prototype;
    this.x = typeof c == "number" ? c : 0;
    this.y = typeof a == "number" ? a : 0;
    this.type = "vector2";
    if (typeof b.set !== "undefined") {
        return
    }
    b.set = function(e, f) {
        this.x = e;
        this.y = f;
        return this
    };
    b.clear = function() {
        this.x = 0;
        this.y = 0;
        return this
    };
    b.copyTo = function(e) {
        e.x = this.x;
        e.y = this.y;
        return this
    };
    b.copyFrom = function(e) {
        this.x = e.x;
        this.y = e.y;
        return this
    };
    b.addVectors = function(f, e) {
        this.x = f.x + e.x;
        this.y = f.y + e.y;
        return this
    };
    b.subVectors = function(f, e) {
        this.x = f.x - e.x;
        this.y = f.y - e.y;
        return this
    };
    b.multiplyVectors = function(f, e) {
        this.x = f.x * e.x;
        this.y = f.y * e.y;
        return this
    };
    b.add = function(e) {
        this.x += e.x;
        this.y += e.y;
        return this
    };
    b.sub = function(e) {
        this.x -= e.x;
        this.y -= e.y;
        return this
    };
    b.multiply = function(e) {
        this.x *= e;
        this.y *= e;
        return this
    };
    b.divide = function(e) {
        this.x /= e;
        this.y /= e;
        return this
    };
    b.lengthSq = function() {
        return (this.x * this.x + this.y * this.y) || 0.00001
    };
    b.length = function() {
        return Math.sqrt(this.lengthSq())
    };
    b.normalize = function() {
        var e = this.length();
        this.x /= e;
        this.y /= e;
        return this
    };
    b.perpendicular = function(h, f) {
        var g = this.x;
        var e = this.y;
        this.x = -e;
        this.y = g;
        return this
    };
    b.lerp = function(e, f) {
        this.x += (e.x - this.x) * f;
        this.y += (e.y - this.y) * f;
        return this
    };
    b.setAngleRadius = function(e, f) {
        this.x = Math.cos(e) * f;
        this.y = Math.sin(e) * f;
        return this
    };
    b.addAngleRadius = function(e, f) {
        this.x += Math.cos(e) * f;
        this.y += Math.sin(e) * f;
        return this
    };
    b.clone = function() {
        return new Vector2(this.x, this.y)
    };
    b.dot = function(f, e) {
        e = e || this;
        return (f.x * e.x + f.y * e.y)
    };
    b.distanceTo = function(g, h) {
        var f = this.x - g.x;
        var e = this.y - g.y;
        if (!h) {
            return Math.sqrt(f * f + e * e)
        }
        return f * f + e * e
    };
    b.solveAngle = function(f, e) {
        if (!e) {
            e = this
        }
        return Math.acos(f.dot(e) / (f.length() * e.length()))
    };
    b.equals = function(e) {
        return this.x == e.x && this.y == e.y
    }
});
Class(function Vector3(d, b, a, e) {
    var f = this;
    var c = Vector3.prototype;
    this.x = typeof d === "number" ? d : 0;
    this.y = typeof b === "number" ? b : 0;
    this.z = typeof a === "number" ? a : 0;
    this.w = typeof e === "number" ? e : 1;
    this.type = "vector3";
    if (typeof c.set !== "undefined") {
        return
    }
    c.set = function(g, k, j, h) {
        this.x = g || 0;
        this.y = k || 0;
        this.z = j || 0;
        this.w = h || 1;
        return this
    };
    c.clear = function() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
        return this
    };
    c.copyTo = function(g) {
        g.x = this.x;
        g.y = this.y;
        g.z = this.z;
        g.w = this.w;
        return g
    };
    c.copyFrom = function(g) {
        this.x = g.x;
        this.y = g.y;
        this.z = g.z;
        this.w = g.w;
        return this
    };
    c.lengthSq = function() {
        return this.x * this.x + this.y * this.y + this.z * this.z
    };
    c.length = function() {
        return Math.sqrt(this.lengthSq())
    };
    c.normalize = function() {
        var g = 1 / this.length();
        this.set(this.x * g, this.y * g, this.z * g);
        return this
    };
    c.addVectors = function(h, g) {
        this.x = h.x + g.x;
        this.y = h.y + g.y;
        this.z = h.z + g.z;
        return this
    };
    c.subVectors = function(h, g) {
        this.x = h.x - g.x;
        this.y = h.y - g.y;
        this.z = h.z - g.z;
        return this
    };
    c.multiplyVectors = function(h, g) {
        this.x = h.x * g.x;
        this.y = h.y * g.y;
        this.z = h.z * g.z;
        return this
    };
    c.add = function(g) {
        this.x += g.x;
        this.y += g.y;
        this.z += g.z;
        return this
    };
    c.sub = function(g) {
        this.x -= g.x;
        this.y -= g.y;
        this.z -= g.z;
        return this
    };
    c.multiply = function(g) {
        this.x *= g;
        this.y *= g;
        this.z *= g;
        return this
    };
    c.divide = function(g) {
        this.x /= g;
        this.y /= g;
        this.z /= g;
        return this
    };
    c.limit = function(g) {
        if (this.length() > g) {
            this.normalize();
            this.multiply(g)
        }
    };
    c.heading2D = function() {
        var g = Math.atan2(-this.y, this.x);
        return -g
    };
    c.lerp = function(g, h) {
        this.x += (g.x - this.x) * h;
        this.y += (g.y - this.y) * h;
        this.z += (g.z - this.z) * h;
        return this
    };
    c.setAngleRadius = function(g, h) {
        this.x = Math.cos(g) * h;
        this.y = Math.sin(g) * h;
        this.z = Math.sin(g) * h;
        return this
    };
    c.addAngleRadius = function(g, h) {
        this.x += Math.cos(g) * h;
        this.y += Math.sin(g) * h;
        this.z += Math.sin(g) * h;
        return this
    };
    c.dot = function(h, g) {
        g = g || this;
        return h.x * g.x + h.y * g.y + h.z * g.z
    };
    c.clone = function() {
        return new Vector3(this.x, this.y, this.z)
    };
    c.cross = function(j, h) {
        if (!h) {
            h = this
        }
        var g = j.y * h.z - j.z * h.y;
        var l = j.z * h.x - j.x * h.z;
        var k = j.x * h.y - j.y * h.x;
        this.set(g, l, k, this.w);
        return this
    };
    c.distanceTo = function(k, l) {
        var j = this.x - k.x;
        var h = this.y - k.y;
        var g = this.z - k.z;
        if (!l) {
            return Math.sqrt(j * j + h * h + g * g)
        }
        return j * j + h * h + g * g
    };
    c.solveAngle = function(h, g) {
        if (!g) {
            g = this
        }
        return Math.acos(h.dot(g) / (h.length() * g.length()))
    };
    c.equals = function(g) {
        return this.x == g.x && this.y == g.y && this.z == g.z
    }
});
Class(function Mobile() {
    Inherit(this, Events);
    var p = this;
    var e;
    var f = true;
    var n = {};
    var k, j, t, l, c;
    this.sleepTime = 10000;
    this.scrollTop = 0;
    if (Device.mobile) {
        for (var s in Device.browser) {
            Device.browser[s] = false
        }
        setInterval(o, 250);
        this.phone = Device.mobile.phone;
        this.tablet = Device.mobile.tablet;
        this.orientation = Math.abs(window.orientation) == 90 ? "landscape" : "portrait";
        this.os = (function() {
            if (Device.detect(["ipad", "iphone"])) {
                return "iOS"
            }
            if (Device.detect(["android", "kindle"])) {
                return "Android"
            }
            if (Device.detect("windows phone", "iemobile")) {
                return "Windows"
            }
            if (Device.detect("blackberry")) {
                return "Blackberry"
            }
            return "Unknown"
        })();
        this.version = (function() {
            try {
                if (p.os == "iOS") {
                    var v = Device.agent.split("os ")[1].split("_");
                    var b = v[0];
                    var w = v[1].split(" ")[0];
                    return Number(b + "." + w)
                }
                if (p.os == "Android") {
                    var u = Device.agent.split("android ")[1].split(";")[0];
                    if (u.length > 3) {
                        u = u.slice(0, -2)
                    }
                    return Number(u)
                }
                if (p.os == "Windows") {
                    return Number(Device.agent.split("windows phone ")[1].split(";")[0])
                }
            } catch (x) {}
            return -1
        })();
        this.browser = (function() {
            if (p.os == "iOS") {
                return Device.detect("crios") ? "Chrome" : "Safari"
            }
            if (p.os == "Android") {
                if (Device.detect("chrome")) {
                    return "Chrome"
                }
                if (Device.detect("firefox")) {
                    return "Firefox"
                }
                return "Browser"
            }
            if (p.os == "Windows") {
                return "IE"
            }
            return "Unknown"
        })();
        Hydra.ready(function() {
            window.addEventListener("orientationchange", a);
            window.addEventListener("touchstart", d);
            window.addEventListener("touchmove", q);
            window.onresize = r;
            if (p.browser == "Safari") {
                document.body.scrollTop = 0
            }
        });

        function r() {
            if (!p.allowScroll) {
                document.body.scrollTop = 0
            }
            setTimeout(function() {
                Stage.width = window.innerWidth;
                Stage.height = window.innerHeight;
                p.events.fire(HydraEvents.RESIZE)
            }, 100)
        }

        function a() {
            p.orientation = Math.abs(window.orientation) == 90 ? "landscape" : "portrait";
            setTimeout(function() {
                Stage.width = window.innerWidth;
                Stage.height = window.innerHeight;
                HydraEvents._fireEvent(HydraEvents.ORIENTATION, {
                    orientation: p.orientation
                })
            }, 100);
            if (p.tablet && p.browser == "Chrome" && j) {
                j = window.innerHeight
            }
            if (p.phone && j) {
                j = Stage.height;
                if (p.orientation == "portrait" && p.browser == "Safari") {
                    t = false;
                    document.body.scrollTop = 0
                }
            }
        }

        function d(w) {
            var x = Utils.touchEvent(w);
            var v = w.target;
            var u = v.nodeName == "INPUT" || v.nodeName == "TEXTAREA" || v.nodeName == "SELECT";
            if (p.allowScroll) {
                return
            }
            if (j) {
                if (!t) {
                    return
                }
                if (p.browser == "Chrome" && x.y < 50) {
                    return
                }
            }
            if (f) {
                return w.preventDefault()
            }
            var b = true;
            var v = w.target;
            while (v.parentNode) {
                if (u) {
                    b = false
                }
                if (v._scrollParent) {
                    b = false;
                    n.target = v;
                    n.y = x.y
                }
                v = v.parentNode
            }
            if (b) {
                w.preventDefault()
            }
        }

        function q(v) {
            var w = Utils.touchEvent(v);
            if (p.allowScroll) {
                return
            }
            if (n.target && Mobile.os == "iOS") {
                var u = n.target;
                var b = u.__scrollHeight || Number((u.style.height || "0px").slice(0, -2));
                u.__scrollheight = b;
                if (w.y < n.y) {
                    if (Math.round(u.scrollTop) == Math.round(b / 2)) {
                        v.preventDefault()
                    }
                } else {
                    if (u.scrollTop == 0) {
                        v.preventDefault()
                    }
                }
            }
        }
    }

    function o() {
        var b = Date.now();
        if (e) {
            if (b - e > p.sleepTime) {
                p.events.fire(HydraEvents.BACKGROUND)
            }
        }
        e = b
    }

    function m() {
        k = true;
        f = false;
        j = Stage.height;
        __body.css({
            height: Stage.height * 3
        });
        Stage.css({
            position: "fixed"
        });
        __window.bind("scroll", g);
        setInterval(h, 1000)
    }

    function g(b) {
        Stage.width = window.innerWidth;
        Stage.height = window.innerHeight;
        p.scrollTop = document.body.scrollTop;
        if (Stage.height != c) {
            p.events.fire(HydraEvents.RESIZE)
        }
        c = Stage.height;
        if (p.scrollTop > 20) {
            t = true;
            j = Stage.height;
            p.events.fire(HydraEvents.FULLSCREEN, {
                fullscreen: true
            })
        }
        h()
    }

    function h() {
        if (window.innerHeight < j && t) {
            Stage.height = window.innerHeight;
            t = false;
            j = Stage.height;
            document.body.scrollTop = 0;
            r();
            p.events.fire(HydraEvents.FULLSCREEN, {
                fullscreen: false
            })
        }
    }
    this.Class = window.Class;
    this.fullscreen = function() {
        if (p.os == "Android") {
            __window.bind("touchstart", function() {
                Device.openFullscreen()
            });
            return true
        } else {
            if (p.os == "iOS" && p.version >= 7) {
                if (p.browser == "Chrome" || p.browser == "Safari") {
                    m();
                    return true
                }
            }
        }
        return false
    };
    this.overflowScroll = function(u, b, w) {
        if (!Device.mobile) {
            return false
        }
        var v = {
            "-webkit-overflow-scrolling": "touch"
        };
        if ((!b && !w) || (b && w)) {
            v.overflow = "scroll"
        }
        if (!b && w) {
            v.overflowY = "scroll";
            v.overflowX = "hidden"
        }
        if (b && !w) {
            v.overflowX = "scroll";
            v.overflowY = "hidden"
        }
        u.css(v);
        u.div._scrollParent = true;
        f = false
    }
}, "Static");
Class(function Spark() {
    Namespace(this);
    this.determine = function(a) {
        return typeof a.z === "undefined" ? Vector2 : Vector3
    }
}, "Static");
Spark.Class(function Emitter(c, e) {
    Inherit(this, Component);
    var h = this;
    var d;
    var b = 0;
    var a = (function() {
        if (c) {
            return c.type == "vector3" ? Vector3 : Vector2
        } else {
            return Vector2
        }
    })();
    this.initializers = [];
    this.position = c || new a();
    this.autoEmit = 1;
    (function() {
        g();
        if (e != 0) {
            f(e || 100)
        }
    })();

    function g() {
        d = h.initClass(ObjectPool)
    }

    function f(l) {
        b += l;
        var k = [];
        for (var j = 0; j < l; j++) {
            k.push(new Spark.Particle())
        }
        d.insert(k)
    }
    this.addInitializer = function(j) {
        if (typeof j !== "function") {
            throw "Initializer must be a function"
        }
        this.initializers.push(j)
    };
    this.removeInitializer = function(k) {
        var j = this.initializers.indexOf(k);
        if (j > -1) {
            this.initializers.splice(j, 1)
        }
    };
    this.emit = function(l) {
        if (!this.parent) {
            throw "Emitter needs to be added to a System"
        }
        l = l || 1;
        for (var m = 0; m < l; m++) {
            var n = d.get();
            if (!n) {
                return
            }
            n.position.copyFrom(this.position);
            n.emitter = this;
            this.parent.addParticle(n);
            for (var k = 0; k < this.initializers.length; k++) {
                this.initializers[k](n)
            }
        }
    };
    this.remove = function(j) {
        d.put(j)
    };
    this.addToPool = function(j) {
        d.put(j)
    }
});
Spark.Class(function System() {
    Inherit(this, Component);
    var f = this;
    var b = {};
    var a = [];
    this.emitters = new LinkedList();
    this.particles = new LinkedList();
    this.behaviors = new LinkedList();
    this.initializers = new LinkedList();
    (function() {})();

    function e(h) {
        var g = f.behaviors.start();
        while (g) {
            g.applyBehavior(h);
            g = f.behaviors.next()
        }
    }

    function c(h) {
        var g = f.initializers.start();
        while (g) {
            g(h);
            g = f.initializers.next()
        }
    }

    function d() {
        for (var g = a.length - 1; g > -1; g--) {
            var h = a[g];
            if (h.emitter) {
                h.emitter.remove(h)
            }
            f.particles.remove(h);
            if (b.destroy) {
                b.destroy(h)
            }
            h.system = null
        }
        a.length = 0
    }
    this.addEmitter = function(g) {
        if (!(g instanceof Spark.Emitter)) {
            throw "Emitter must be Spark.Emitter"
        }
        this.emitters.push(g);
        g.parent = this
    };
    this.removeEmitter = function(g) {
        if (!(g instanceof Spark.Emitter)) {
            throw "Emitter must be Spark.Emitter"
        }
        this.emitters.remove(g);
        g.parent = null
    };
    this.addInitializer = function(g) {
        if (typeof callback !== "function") {
            throw "Initializer must be a function"
        }
        this.initializers.add(g)
    };
    this.removeInitializer = function(g) {
        this.initializers.remove(g)
    };
    this.addParticle = function(g) {
        if (!(g instanceof Spark.Particle)) {
            throw "Particle must be Spark.Particle"
        }
        this.particles.push(g);
        if (b.create) {
            b.create(g)
        }
        g.system = this;
        c(g)
    };
    this.removeParticle = function(g) {
        if (!(g instanceof Spark.Particle)) {
            throw "Particle must be Spark.Particle"
        }
        a.push(g)
    };
    this.addBehavior = function(g) {
        if (g && !g.applyBehavior && typeof g === "function") {
            g.applyBehavior = g
        }
        if (!g || typeof g.applyBehavior === "undefined") {
            throw "Behavior must have applyBehavior method"
        }
        this.behaviors.push(g);
        g.system = this
    };
    this.removeBehavior = function(g) {
        if (!g || typeof g.applyBehavior === "undefined") {
            throw "Behavior must have applyBehavior method"
        }
        this.behaviors.remove(g);
        g.system = null
    };
    this.update = function() {
        var g = this.particles.start();
        while (g) {
            e(g);
            g.update();
            if (b.update) {
                b.update(g)
            }
            g = this.particles.next()
        }
        if (a.length) {
            d()
        }
    };
    this.bind = function(g, h) {
        b[g] = h
    };
    this.unbind = function(g) {
        delete b[g]
    }
});
Spark.Class(function Particle(g, e, c) {
    var h = this;
    var a = typeof c === "number" ? Vector3 : Vector2;
    var f = Particle.prototype;
    var b;
    var d = new a();
    this.saveTo = null;
    this.locked = false;
    this.damping = null;
    this.mass = 1;
    this.position = new a(g, e, c);
    this.velocity = new a();
    this.acceleration = new a();
    this.behaviors = new LinkedList();
    if (typeof f.update !== "undefined") {
        return
    }
    f.update = function() {
        this.updateBehaviors();
        this.velocity.add(this.acceleration);
        if (!this.locked) {
            this.position.add(this.velocity)
        }
        this.acceleration.clear();
        if (this.damping) {
            this.velocity.multiply(this.damping)
        }
        if (this.saveTo) {
            this.position.copyTo(this.saveTo)
        }
    };
    f.updateBehaviors = function() {
        var j = this.behaviors.start();
        while (j) {
            var k = this.system.particles.start(h);
            while (k) {
                if (k != this) {
                    j.applyBehavior(k)
                }
                k = this.system.particles.next(h)
            }
            j = this.behaviors.next()
        }
    };
    f.applyForce = function(j) {
        d.copyFrom(j).multiply(1 / this.mass);
        this.acceleration.add(d)
    };
    f.addBehavior = function(j) {
        if (!j || typeof j.applyBehavior === "undefined") {
            throw "Behavior must have applyBehavior method"
        }
        if (j.position) {
            j.position = this
        }
        this.behaviors.push(j)
    };
    f.removeBehavior = function(j) {
        if (!j || typeof j.applyBehavior === "undefined") {
            throw "Behavior must have applyBehavior method"
        }
        this.behaviors.remove(j)
    };
    f.destroy = function() {
        if (this.system) {
            this.system.removeParticle(this)
        }
    }
});
Class(function D3() {
    Namespace(this);
    this.CSS3D = Device.tween.css3d;
    this.m4v31 = new Vector3();
    this.m4v32 = new Vector3();
    this.m4v33 = new Vector3();
    this.UP = new Vector3(0, 1, 0);
    this.FWD = new Vector3(0, 0, -1);
    this.CENTER = new Vector3(0, 0, 0);
    this.translate = function(a, c, b) {
        a = typeof a == "string" ? a : (a || 0) + "px";
        c = typeof c == "string" ? c : (c || 0) + "px";
        b = typeof b == "string" ? b : (b || 0) + "px";
        if (Device.browser.ie) {
            a = 0;
            c = 0
        }
        return "translate3d(" + a + "," + c + "," + b + ")"
    }
}, "Static");
Class(function CSSAnimation() {
    Inherit(this, Component);
    var k = this;
    var o = "a" + Utils.timestamp();
    var c, h, l;
    var j = 1000;
    var a = "linear";
    var e = false;
    var m = 1;
    var p = null;
    var d = [];
    (function() {})();

    function b() {
        k.playing = false;
        if (k.events) {
            k.events.fire(HydraEvents.COMPLETE, null, true)
        }
    }

    function f() {
        var v = CSS._read();
        var q = "/*" + o + "*/";
        var E = "@" + Device.vendor + "keyframes " + o + " {\n";
        var w = q + E;
        if (v.strpos(o)) {
            var y = v.split(q);
            v = v.replace(q + y[1] + q, "")
        }
        var A = c.length - 1;
        var B = Math.round(100 / A);
        var z = 0;
        for (var u = 0; u < c.length; u++) {
            var s = c[u];
            if (u == c.length - 1) {
                z = 100
            }
            w += (s.percent || z) + "% {\n";
            var r = false;
            var x = {};
            var D = {};
            for (var C in s) {
                if (TweenManager.checkTransform(C)) {
                    x[C] = s[C];
                    r = true
                } else {
                    D[C] = s[C]
                }
            }
            if (r) {
                w += Device.vendor + "transform: " + TweenManager.parseTransform(x) + ";"
            }
            for (C in D) {
                var t = D[C];
                if (typeof t !== "string" && C != "opacity" && C != "zIndex") {
                    t += "px"
                }
                w += CSS._toCSS(C) + ": " + t + ";"
            }
            w += "\n}\n";
            z += B
        }
        w += "}" + q;
        v += w;
        CSS._write(v)
    }

    function n() {
        var r = CSS._read();
        var s = "/*" + o + "*/";
        if (r.strpos(o)) {
            var q = r.split(s);
            r = r.replace(s + q[1] + s, "")
        }
        CSS._write(r)
    }

    function g(r) {
        for (var q = d.length - 1; q > -1; q--) {
            r(d[q])
        }
    }
    this.set("frames", function(q) {
        c = q;
        f()
    });
    this.set("steps", function(q) {
        p = q;
        if (k.playing) {
            g(function(r) {
                r.div.style[CSS.prefix("AnimationTimingFunction")] = "steps(" + q + ")"
            })
        }
    });
    this.set("duration", function(q) {
        j = Math.round(q);
        if (k.playing) {
            g(function(r) {
                r.div.style[CSS.prefix("AnimationDuration")] = k.duration + "ms"
            })
        }
    });
    this.get("duration", function() {
        return j
    });
    this.set("ease", function(q) {
        a = q;
        if (k.playing) {
            g(function(r) {
                r.div.style[CSS.prefix("AnimationTimingFunction")] = TweenManager.getEase(a)
            })
        }
    });
    this.get("ease", function() {
        return a
    });
    this.set("loop", function(q) {
        e = q;
        if (k.playing) {
            g(function(r) {
                r.div.style[CSS.prefix("AnimationIterationCount")] = e ? "infinite" : m
            })
        }
    });
    this.get("loop", function() {
        return e
    });
    this.set("count", function(q) {
        m = q;
        if (k.playing) {
            g(function(r) {
                r.div.style[CSS.prefix("AnimationIterationCount")] = e ? "infinite" : m
            })
        }
    });
    this.get("count", function() {
        return m
    });
    this.play = function() {
        g(function(q) {
            q.div.style[CSS.prefix("AnimationName")] = o;
            q.div.style[CSS.prefix("AnimationDuration")] = k.duration + "ms";
            q.div.style[CSS.prefix("AnimationTimingFunction")] = p ? "steps(" + p + ")" : TweenManager.getEase(a);
            q.div.style[CSS.prefix("AnimationIterationCount")] = e ? "infinite" : m;
            q.div.style[CSS.prefix("AnimationPlayState")] = "running"
        });
        k.playing = true;
        clearTimeout(h);
        if (!k.loop) {
            l = Date.now();
            h = setTimeout(b, m * j)
        }
    };
    this.pause = function() {
        k.playing = false;
        clearTimeout(h);
        g(function(q) {
            q.div.style[CSS.prefix("AnimationPlayState")] = "paused"
        })
    };
    this.stop = function() {
        k.playing = false;
        clearTimeout(h);
        g(function(q) {
            q.div.style[CSS.prefix("AnimationName")] = ""
        })
    };
    this.applyTo = function(q) {
        d.push(q)
    };
    this.remove = function(r) {
        r.div.style[CSS.prefix("AnimationName")] = "";
        var q = d.indexOf(r);
        if (q > -1) {
            d.splice(q, 1)
        }
    };
    this.destroy = function() {
        this.stop();
        c = null;
        n();
        return this._destroy()
    }
});
Class(function TweenManager() {
    Namespace(this);
    var f = this;
    var a = [];
    var d, c;
    (function() {
        Hydra.ready(b);
        Render.startRender(e)
    })();

    function b() {
        f._dynamicPool = new ObjectPool(DynamicObject, 100);
        f._arrayPool = new ObjectPool(Array, 100)
    }

    function e(h) {
        for (var g = 0; g < a.length; g++) {
            a[g].update(h)
        }
    }
    this._addMathTween = function(g) {
        a.push(g)
    };
    this._removeMathTween = function(g) {
        a.findAndRemove(g)
    };
    this._detectTween = function(h, j, k, l, g, m) {
        if (l === "spring") {
            return new SpringTween(h, j, k, l, g, m)
        }
        if (f.useCSSTransition(j, l)) {
            return new CSSTransition(h, j, k, l, g, m)
        } else {
            return new FrameTween(h, j, k, l, g, m)
        }
    };
    this.tween = function(l, j, k, m, h, g, n) {
        if (typeof h !== "number") {
            n = g;
            g = h;
            h = 0
        }
        if (m === "spring") {
            return new SpringTween(l, j, k, m, h, n, g)
        } else {
            return new MathTween(l, j, k, m, h, n, g)
        }
    };
    this.iterate = function(p, q, h, j, k, n, r) {
        if (typeof n !== "number") {
            r = n;
            n = 0
        }
        q = new DynamicObject(q);
        if (!p.length) {
            throw "TweenManager.iterate :: array is empty"
        }
        var o = p.length;
        for (var m = 0; m < o; m++) {
            var l = p[m];
            var g = m == o - 1 ? r : null;
            l.tween(q.copy(), h, j, n + (k * m), g)
        }
    };
    this.clearTween = function(g) {
        if (g._mathTween && g._mathTween.stop) {
            g._mathTween.stop()
        }
    };
    this.clearCSSTween = function(g) {
        if (g && !g._cssTween && g.div._transition) {
            g.div.style[Device.styles.vendorTransition] = "";
            g.div._transition = false
        }
    };
    this.checkTransform = function(h) {
        var g = f.Transforms.indexOf(h);
        return g > -1
    };
    this.addCustomEase = function(j) {
        var h = true;
        if (typeof j !== "object" || !j.name || !j.curve) {
            throw "TweenManager :: addCustomEase requires {name, curve}"
        }
        for (var g = f.CSSEases.length - 1; g > -1; g--) {
            if (j.name == f.CSSEases[g].name) {
                h = false
            }
        }
        if (h) {
            j.values = j.curve.split("(")[1].slice(0, -1).split(",");
            for (g = 0; g < j.values.length; g++) {
                j.values[g] = parseFloat(j.values[g])
            }
            f.CSSEases.push(j)
        }
    };
    this.getEase = function(h, g) {
        var k = f.CSSEases;
        for (var j = k.length - 1; j > -1; j--) {
            if (k[j].name == h) {
                if (g) {
                    return k[j].values
                }
                return k[j].curve
            }
        }
        return false
    };
    this.getAllTransforms = function(g) {
        var k = {};
        for (var h = f.Transforms.length - 1; h > -1; h--) {
            var j = f.Transforms[h];
            var l = g[j];
            if (l !== 0 && typeof l === "number") {
                k[j] = l
            }
        }
        return k
    };
    this.parseTransform = function(j) {
        var h = "";
        var l = "";
        if (typeof j.x !== "undefined" || typeof j.y !== "undefined" || typeof j.z !== "undefined") {
            var g = (j.x || 0);
            var m = (j.y || 0);
            var k = (j.z || 0);
            l += g + "px, ";
            l += m + "px";
            if (Device.tween.css3d) {
                l += ", " + k + "px";
                h += "translate3d(" + l + ")"
            } else {
                h += "translate(" + l + ")"
            }
        }
        if (typeof j.scale !== "undefined") {
            h += "scale(" + j.scale + ")"
        } else {
            if (typeof j.scaleX !== "undefined") {
                h += "scaleX(" + j.scaleX + ")"
            }
            if (typeof j.scaleY !== "undefined") {
                h += "scaleY(" + j.scaleY + ")"
            }
        }
        if (typeof j.rotation !== "undefined") {
            h += "rotate(" + j.rotation + "deg)"
        }
        if (typeof j.rotationX !== "undefined") {
            h += "rotateX(" + j.rotationX + "deg)"
        }
        if (typeof j.rotationY !== "undefined") {
            h += "rotateY(" + j.rotationY + "deg)"
        }
        if (typeof j.rotationZ !== "undefined") {
            h += "rotateZ(" + j.rotationZ + "deg)"
        }
        if (typeof j.skewX !== "undefined") {
            h += "skewX(" + j.skewX + "deg)"
        }
        if (typeof j.skewY !== "undefined") {
            h += "skewY(" + j.skewY + "deg)"
        }
        return h
    }
}, "Static");
(function() {
    TweenManager.Transforms = ["scale", "scaleX", "scaleY", "x", "y", "z", "rotation", "rotationX", "rotationY", "rotationZ", "skewX", "skewY", ];
    TweenManager.CSSEases = [{
        name: "easeOutCubic",
        curve: "cubic-bezier(0.215, 0.610, 0.355, 1.000)"
    }, {
        name: "easeOutQuad",
        curve: "cubic-bezier(0.250, 0.460, 0.450, 0.940)"
    }, {
        name: "easeOutQuart",
        curve: "cubic-bezier(0.165, 0.840, 0.440, 1.000)"
    }, {
        name: "easeOutQuint",
        curve: "cubic-bezier(0.230, 1.000, 0.320, 1.000)"
    }, {
        name: "easeOutSine",
        curve: "cubic-bezier(0.390, 0.575, 0.565, 1.000)"
    }, {
        name: "easeOutExpo",
        curve: "cubic-bezier(0.190, 1.000, 0.220, 1.000)"
    }, {
        name: "easeOutCirc",
        curve: "cubic-bezier(0.075, 0.820, 0.165, 1.000)"
    }, {
        name: "easeOutBack",
        curve: "cubic-bezier(0.175, 0.885, 0.320, 1.275)"
    }, {
        name: "easeInCubic",
        curve: "cubic-bezier(0.550, 0.055, 0.675, 0.190)"
    }, {
        name: "easeInQuad",
        curve: "cubic-bezier(0.550, 0.085, 0.680, 0.530)"
    }, {
        name: "easeInQuart",
        curve: "cubic-bezier(0.895, 0.030, 0.685, 0.220)"
    }, {
        name: "easeInQuint",
        curve: "cubic-bezier(0.755, 0.050, 0.855, 0.060)"
    }, {
        name: "easeInSine",
        curve: "cubic-bezier(0.470, 0.000, 0.745, 0.715)"
    }, {
        name: "easeInCirc",
        curve: "cubic-bezier(0.600, 0.040, 0.980, 0.335)"
    }, {
        name: "easeInBack",
        curve: "cubic-bezier(0.600, -0.280, 0.735, 0.045)"
    }, {
        name: "easeInOutCubic",
        curve: "cubic-bezier(0.645, 0.045, 0.355, 1.000)"
    }, {
        name: "easeInOutQuad",
        curve: "cubic-bezier(0.455, 0.030, 0.515, 0.955)"
    }, {
        name: "easeInOutQuart",
        curve: "cubic-bezier(0.770, 0.000, 0.175, 1.000)"
    }, {
        name: "easeInOutQuint",
        curve: "cubic-bezier(0.860, 0.000, 0.070, 1.000)"
    }, {
        name: "easeInOutSine",
        curve: "cubic-bezier(0.445, 0.050, 0.550, 0.950)"
    }, {
        name: "easeInOutExpo",
        curve: "cubic-bezier(1.000, 0.000, 0.000, 1.000)"
    }, {
        name: "easeInOutCirc",
        curve: "cubic-bezier(0.785, 0.135, 0.150, 0.860)"
    }, {
        name: "easeInOutBack",
        curve: "cubic-bezier(0.680, -0.550, 0.265, 1.550)"
    }, {
        name: "linear",
        curve: "linear"
    }];
    TweenManager.useCSSTransition = function(a, b) {
        if (a.math) {
            return false
        }
        if (b.strpos("Elastic") || b.strpos("Bounce")) {
            return false
        }
        if (!Device.tween.transition) {
            return false
        }
        return true
    }
})();
Class(function CSSTransition(l, m, n, a, k, o) {
    var j = this;
    var c, d;
    this.playing = true;
    (function() {
        if (l && m) {
            if (typeof n !== "number") {
                throw "CSSTween Requires object, props, time, ease"
            }
            f();
            g()
        }
    })();

    function h() {
        return j.kill || !l || !l.div
    }

    function f() {
        var p = TweenManager.getAllTransforms(l);
        var r = TweenManager._arrayPool.get();
        r.length = 0;
        for (var q in m) {
            if (TweenManager.checkTransform(q)) {
                p.use = true;
                p[q] = m[q];
                delete m[q]
            } else {
                r.push(q)
            }
        }
        if (p.use) {
            r.push(Device.transformProperty)
        }
        c = p;
        d = r
    }

    function g() {
        if (h()) {
            return
        }
        if (l._cssTween) {
            l._cssTween.kill = true
        }
        l._cssTween = j;
        l.div._transition = true;
        var r = "";
        var p = d.length;
        for (var q = 0; q < p; q++) {
            r += (r.length ? ", " : "") + d[q] + " " + n + "ms " + TweenManager.getEase(a) + " " + k + "ms"
        }
        Render.setupTween(function() {
            if (h()) {
                return
            }
            l.div.style[Device.styles.vendorTransition] = r;
            l.css(m);
            l.transform(c);
            j.playing = true;
            if (o) {
                setTimeout(function() {
                    if (h()) {
                        return
                    }
                    Render.nextFrame(function() {
                        o.apply(l)
                    })
                }, n + k - 16)
            }
            l.div.addEventListener(Device.tween.complete, b)
        })
    }

    function e() {
        if (h()) {
            return
        }
        l.div.removeEventListener(Device.tween.complete, b);
        j.playing = false;
        l._cssTween = null;
        l = m = null
    }

    function b() {
        if (j.playing) {
            e()
        }
    }
    this.stop = function() {
        if (!this.playing) {
            return
        }
        this.kill = true;
        this.playing = false;
        l.div.style[Device.styles.vendorTransition] = "";
        l.div._transition = false;
        e()
    }
});
Class(function FrameTween(h, r, t, f, m, l) {
    var p = this;
    var u, c, j, w;
    var q, a, e;
    var d, g;
    this.playing = true;
    (function() {
        if (h && r) {
            if (typeof t !== "number") {
                throw "FrameTween Requires object, props, time, ease"
            }
            s();
            b()
        }
    })();

    function v() {
        return p.kill || !h || !h.div
    }

    function s() {
        if (r.math) {
            delete r.math
        }
        if (Device.tween.transition && h.div._transition) {
            h.div.style[Device.styles.vendorTransition] = "";
            h.div._transition = false
        }
        u = TweenManager._dynamicPool.get();
        c = TweenManager._dynamicPool.get();
        j = TweenManager._dynamicPool.get();
        w = TweenManager._dynamicPool.get();
        if (typeof r.x === "undefined") {
            r.x = h.x
        }
        if (typeof r.y === "undefined") {
            r.y = h.y
        }
        if (typeof r.z === "undefined") {
            r.z = h.z
        }
        for (var y in r) {
            if (TweenManager.checkTransform(y)) {
                q = true;
                j[y] = h[y] || 0;
                c[y] = r[y]
            } else {
                a = true;
                var x = r[y];
                if (typeof x === "string") {
                    h.div.style[y] = x
                } else {
                    if (typeof x === "number") {
                        w[y] = Number(h.css(y));
                        u[y] = x
                    }
                }
            }
        }
    }

    function b() {
        if (h._cssTween) {
            h._cssTween.kill = true
        }
        h._cssTween = p;
        p.playing = true;
        r = w.copy(TweenManager._dynamicPool);
        e = j.copy(TweenManager._dynamicPool);
        if (a) {
            d = TweenManager.tween(r, u, t, f, m, o, k)
        }
        if (q) {
            g = TweenManager.tween(e, c, t, f, m, (!a ? o : null), (!a ? k : null))
        }
    }

    function n() {
        p.playing = false;
        h._cssTween = null;
        h = r = null;
        TweenManager._dynamicPool.put(u.clear());
        TweenManager._dynamicPool.put(c.clear());
        TweenManager._dynamicPool.put(j.clear());
        TweenManager._dynamicPool.put(w.clear());
        TweenManager._dynamicPool.put(e.clear())
    }

    function k() {
        if (v()) {
            return
        }
        if (a) {
            h.css(r)
        }
        if (q) {
            h.transform(e)
        }
    }

    function o() {
        if (p.playing) {
            n();
            if (l) {
                Render.nextFrame(function() {
                    l.apply(h)
                })
            }
        }
    }
    this.stop = function() {
        if (!this.playing) {
            return
        }
        if (d && d.stop) {
            d.stop()
        }
        if (g && g.stop) {
            g.stop()
        }
        n()
    }
});
TweenManager.Class(function Interpolation() {
    function d(j, g, h) {
        return ((a(g, h) * j + f(g, h)) * j + e(g)) * j
    }

    function b(k, n, l) {
        var h = k;
        for (var j = 0; j < 4; j++) {
            var m = c(h, n, l);
            if (m == 0) {
                return h
            }
            var g = d(h, n, l) - k;
            h -= g / m
        }
        return h
    }

    function c(j, g, h) {
        return 3 * a(g, h) * j * j + 2 * f(g, h) * j + e(g)
    }

    function a(g, h) {
        return 1 - 3 * h + 3 * g
    }

    function f(g, h) {
        return 3 * h - 6 * g
    }

    function e(g) {
        return 3 * g
    }
    this.convertEase = function(j) {
        var g = (function() {
            switch (j) {
                case "easeInQuad":
                    return TweenManager.Interpolation.Quad.In;
                    break;
                case "easeInCubic":
                    return TweenManager.Interpolation.Cubic.In;
                    break;
                case "easeInQuart":
                    return TweenManager.Interpolation.Quart.In;
                    break;
                case "easeInQuint":
                    return TweenManager.Interpolation.Quint.In;
                    break;
                case "easeInSine":
                    return TweenManager.Interpolation.Sine.In;
                    break;
                case "easeInExpo":
                    return TweenManager.Interpolation.Expo.In;
                    break;
                case "easeInCirc":
                    return TweenManager.Interpolation.Circ.In;
                    break;
                case "easeInElastic":
                    return TweenManager.Interpolation.Elastic.In;
                    break;
                case "easeInBack":
                    return TweenManager.Interpolation.Back.In;
                    break;
                case "easeInBounce":
                    return TweenManager.Interpolation.Bounce.In;
                    break;
                case "easeOutQuad":
                    return TweenManager.Interpolation.Quad.Out;
                    break;
                case "easeOutCubic":
                    return TweenManager.Interpolation.Cubic.Out;
                    break;
                case "easeOutQuart":
                    return TweenManager.Interpolation.Quart.Out;
                    break;
                case "easeOutQuint":
                    return TweenManager.Interpolation.Quint.Out;
                    break;
                case "easeOutSine":
                    return TweenManager.Interpolation.Sine.Out;
                    break;
                case "easeOutExpo":
                    return TweenManager.Interpolation.Expo.Out;
                    break;
                case "easeOutCirc":
                    return TweenManager.Interpolation.Circ.Out;
                    break;
                case "easeOutElastic":
                    return TweenManager.Interpolation.Elastic.Out;
                    break;
                case "easeOutBack":
                    return TweenManager.Interpolation.Back.Out;
                    break;
                case "easeOutBounce":
                    return TweenManager.Interpolation.Bounce.Out;
                    break;
                case "easeInOutQuad":
                    return TweenManager.Interpolation.Quad.InOut;
                    break;
                case "easeInOutCubic":
                    return TweenManager.Interpolation.Cubic.InOut;
                    break;
                case "easeInOutQuart":
                    return TweenManager.Interpolation.Quart.InOut;
                    break;
                case "easeInOutQuint":
                    return TweenManager.Interpolation.Quint.InOut;
                    break;
                case "easeInOutSine":
                    return TweenManager.Interpolation.Sine.InOut;
                    break;
                case "easeInOutExpo":
                    return TweenManager.Interpolation.Expo.InOut;
                    break;
                case "easeInOutCirc":
                    return TweenManager.Interpolation.Circ.InOut;
                    break;
                case "easeInOutElastic":
                    return TweenManager.Interpolation.Elastic.InOut;
                    break;
                case "easeInOutBack":
                    return TweenManager.Interpolation.Back.InOut;
                    break;
                case "easeInOutBounce":
                    return TweenManager.Interpolation.Bounce.InOut;
                    break;
                case "linear":
                    return TweenManager.Interpolation.Linear.None;
                    break
            }
        })();
        if (!g) {
            var h = TweenManager.getEase(j, true);
            if (h) {
                g = h
            } else {
                g = TweenManager.Interpolation.Cubic.Out
            }
        }
        return g
    };
    this.solve = function(h, g) {
        if (h[0] == h[1] && h[2] == h[3]) {
            return g
        }
        return d(b(g, h[0], h[2]), h[1], h[3])
    }
}, "Static");
(function() {
    TweenManager.Interpolation.Linear = {
        None: function(a) {
            return a
        }
    };
    TweenManager.Interpolation.Quad = {
        In: function(a) {
            return a * a
        },
        Out: function(a) {
            return a * (2 - a)
        },
        InOut: function(a) {
            if ((a *= 2) < 1) {
                return 0.5 * a * a
            }
            return -0.5 * (--a * (a - 2) - 1)
        }
    };
    TweenManager.Interpolation.Cubic = {
        In: function(a) {
            return a * a * a
        },
        Out: function(a) {
            return --a * a * a + 1
        },
        InOut: function(a) {
            if ((a *= 2) < 1) {
                return 0.5 * a * a * a
            }
            return 0.5 * ((a -= 2) * a * a + 2)
        }
    };
    TweenManager.Interpolation.Quart = {
        In: function(a) {
            return a * a * a * a
        },
        Out: function(a) {
            return 1 - --a * a * a * a
        },
        InOut: function(a) {
            if ((a *= 2) < 1) {
                return 0.5 * a * a * a * a
            }
            return -0.5 * ((a -= 2) * a * a * a - 2)
        }
    };
    TweenManager.Interpolation.Quint = {
        In: function(a) {
            return a * a * a * a * a
        },
        Out: function(a) {
            return --a * a * a * a * a + 1
        },
        InOut: function(a) {
            if ((a *= 2) < 1) {
                return 0.5 * a * a * a * a * a
            }
            return 0.5 * ((a -= 2) * a * a * a * a + 2)
        }
    };
    TweenManager.Interpolation.Sine = {
        In: function(a) {
            return 1 - Math.cos(a * Math.PI / 2)
        },
        Out: function(a) {
            return Math.sin(a * Math.PI / 2)
        },
        InOut: function(a) {
            return 0.5 * (1 - Math.cos(Math.PI * a))
        }
    };
    TweenManager.Interpolation.Expo = {
        In: function(a) {
            return a === 0 ? 0 : Math.pow(1024, a - 1)
        },
        Out: function(a) {
            return a === 1 ? 1 : 1 - Math.pow(2, -10 * a)
        },
        InOut: function(a) {
            if (a === 0) {
                return 0
            }
            if (a === 1) {
                return 1
            }
            if ((a *= 2) < 1) {
                return 0.5 * Math.pow(1024, a - 1)
            }
            return 0.5 * (-Math.pow(2, -10 * (a - 1)) + 2)
        }
    };
    TweenManager.Interpolation.Circ = {
        In: function(a) {
            return 1 - Math.sqrt(1 - a * a)
        },
        Out: function(a) {
            return Math.sqrt(1 - --a * a)
        },
        InOut: function(a) {
            if ((a *= 2) < 1) {
                return -0.5 * (Math.sqrt(1 - a * a) - 1)
            }
            return 0.5 * (Math.sqrt(1 - (a -= 2) * a) + 1)
        }
    };
    TweenManager.Interpolation.Elastic = {
        In: function(c) {
            var d, b = 0.1,
                e = 0.4;
            if (c === 0) {
                return 0
            }
            if (c === 1) {
                return 1
            }
            if (!b || b < 1) {
                b = 1;
                d = e / 4
            } else {
                d = e * Math.asin(1 / b) / (2 * Math.PI)
            }
            return -(b * Math.pow(2, 10 * (c -= 1)) * Math.sin((c - d) * (2 * Math.PI) / e))
        },
        Out: function(c) {
            var d, b = 0.1,
                e = 0.4;
            if (c === 0) {
                return 0
            }
            if (c === 1) {
                return 1
            }
            if (!b || b < 1) {
                b = 1;
                d = e / 4
            } else {
                d = e * Math.asin(1 / b) / (2 * Math.PI)
            }
            return (b * Math.pow(2, -10 * c) * Math.sin((c - d) * (2 * Math.PI) / e) + 1)
        },
        InOut: function(c) {
            var d, b = 0.1,
                e = 0.4;
            if (c === 0) {
                return 0
            }
            if (c === 1) {
                return 1
            }
            if (!b || b < 1) {
                b = 1;
                d = e / 4
            } else {
                d = e * Math.asin(1 / b) / (2 * Math.PI)
            }
            if ((c *= 2) < 1) {
                return -0.5 * (b * Math.pow(2, 10 * (c -= 1)) * Math.sin((c - d) * (2 * Math.PI) / e))
            }
            return b * Math.pow(2, -10 * (c -= 1)) * Math.sin((c - d) * (2 * Math.PI) / e) * 0.5 + 1
        }
    };
    TweenManager.Interpolation.Back = {
        In: function(a) {
            var b = 1.70158;
            return a * a * ((b + 1) * a - b)
        },
        Out: function(a) {
            var b = 1.70158;
            return --a * a * ((b + 1) * a + b) + 1
        },
        InOut: function(a) {
            var b = 1.70158 * 1.525;
            if ((a *= 2) < 1) {
                return 0.5 * (a * a * ((b + 1) * a - b))
            }
            return 0.5 * ((a -= 2) * a * ((b + 1) * a + b) + 2)
        }
    };
    TweenManager.Interpolation.Bounce = {
        In: function(a) {
            return 1 - TweenManager.Interpolation.Bounce.Out(1 - a)
        },
        Out: function(a) {
            if (a < (1 / 2.75)) {
                return 7.5625 * a * a
            } else {
                if (a < (2 / 2.75)) {
                    return 7.5625 * (a -= (1.5 / 2.75)) * a + 0.75
                } else {
                    if (a < (2.5 / 2.75)) {
                        return 7.5625 * (a -= (2.25 / 2.75)) * a + 0.9375
                    } else {
                        return 7.5625 * (a -= (2.625 / 2.75)) * a + 0.984375
                    }
                }
            }
        },
        InOut: function(a) {
            if (a < 0.5) {
                return TweenManager.Interpolation.Bounce.In(a * 2) * 0.5
            }
            return TweenManager.Interpolation.Bounce.Out(a * 2 - 1) * 0.5 + 0.5
        }
    }
})();
Class(function MathTween(m, o, p, b, k, n, q) {
    var j = this;
    var d, a, g;
    var e, f;
    var l = 0;
    (function() {
        if (m && o) {
            if (typeof p !== "number") {
                throw "MathTween Requires object, props, time, ease"
            }
            c()
        }
    })();

    function c() {
        if (!m.multipleTweens && m._mathTween) {
            TweenManager.clearTween(m)
        }
        m._mathTween = j;
        TweenManager._addMathTween(j);
        b = TweenManager.Interpolation.convertEase(b);
        e = typeof b === "function";
        d = Date.now();
        d += k;
        g = o;
        a = TweenManager._dynamicPool.get();
        for (var r in g) {
            if (typeof m[r] === "number") {
                a[r] = m[r]
            }
        }
    }

    function h() {
        if (!m && !o) {
            return false
        }
        m._mathTween = null;
        TweenManager._dynamicPool.put(a.clear());
        TweenManager._removeMathTween(j);
        Utils.nullObject(j)
    }
    this.update = function(s) {
        if (f || s < d) {
            return
        }
        l = (s - d) / p;
        l = l > 1 ? 1 : l;
        var v = e ? b(l) : TweenManager.Interpolation.solve(b, l);
        for (var u in a) {
            if (typeof a[u] === "number") {
                var t = a[u];
                var r = g[u];
                m[u] = t + (r - t) * v
            }
        }
        if (n) {
            n(s)
        }
        if (l == 1) {
            if (q) {
                q.apply(m)
            }
            h()
        }
    };
    this.pause = function() {
        f = true
    };
    this.resume = function() {
        f = false;
        d = Date.now() - (l * p)
    };
    this.stop = function() {
        j.stopped = true;
        h();
        return null
    }
});
Class(function SpringTween(o, q, j, b, m, r, p) {
    var l = this;
    var d, e, h, a;
    var f, j, n, g;
    (function() {
        if (o && q) {
            if (typeof j !== "number") {
                throw "SpringTween Requires object, props, time, ease"
            }
            c()
        }
    })();

    function c() {
        TweenManager.clearTween(o);
        o._mathTween = l;
        TweenManager._addMathTween(l);
        d = Date.now();
        d += m;
        h = TweenManager._dynamicPool.get();
        a = TweenManager._dynamicPool.get();
        e = TweenManager._dynamicPool.get();
        if (typeof q.x === "undefined") {
            q.x = o.x
        }
        if (typeof q.y === "undefined") {
            q.y = o.y
        }
        if (typeof q.z === "undefined") {
            q.z = o.z
        }
        n = 0;
        f = q.damping || 0.5;
        for (var s in q) {
            if (typeof q[s] === "number") {
                e[s] = 0;
                h[s] = q[s]
            }
        }
        for (s in q) {
            if (typeof o[s] === "number") {
                a[s] = o[s] || 0;
                q[s] = a[s]
            }
        }
        delete q.damping
    }

    function k() {
        if (o) {
            o._mathTween = null;
            for (var s in h) {
                if (typeof h[s] === "number") {
                    o[s] = h[s]
                }
            }
            if (o.transform) {
                o.transform()
            }
        }
        TweenManager._dynamicPool.put(a.clear());
        TweenManager._dynamicPool.put(h.clear());
        TweenManager._dynamicPool.put(e.clear());
        TweenManager._removeMathTween(l)
    }
    this.update = function(v) {
        if (v < d || g) {
            return
        }
        var u;
        for (var z in a) {
            if (typeof a[z] === "number") {
                var y = a[z];
                var t = h[z];
                var x = q[z];
                var w = t - x;
                var s = w * f;
                e[z] += s;
                e[z] *= j;
                q[z] += e[z];
                o[z] = q[z];
                u = e[z]
            }
        }
        if (Math.abs(u) < 0.01) {
            n++;
            if (n > 30) {
                if (r) {
                    r.apply(o)
                }
                k()
            }
        }
        if (p) {
            p(v)
        }
        if (o.transform) {
            o.transform()
        }
    };
    this.pause = function() {
        g = true
    };
    this.stop = function() {
        k();
        return null
    }
});
Class(function GATracker() {
    this.trackPage = function(a) {
        if (typeof ga !== "undefined") {
            ga("send", "pageview", a)
        }
    };
    this.trackEvent = function(b, d, a, c) {
        if (typeof ga !== "undefined") {
            ga("send", "event", b, d, a, (c || 0))
        }
    }
}, "Static");
Class(function Config() {
    var a = this;
    this.PROXY = "";
    this.START_COLOR = "day";
    this.CDN = (function() {
        if (window.location.hostname.strpos("findingho.me")) {
            a.PROXY = "http://" + window.location.hostname + "/cdn/";
            return "http://findinghome.s3-us-west-2.amazonaws.com/"
        } else {
            return ""
        }
    })();
    this.COLORS = {
        day: {
            terrain: {
                color0: 8494794,
                color1: 13946091
            },
            water: {
                color0: 9684430,
                color1: 6919864
            },
            sky: {
                color0: 13481177,
                color1: 6972880
            },
            fog: {
                color0: 11048918,
            }
        },
        dusk: {
            terrain: {
                color0: 13012095,
                color1: 15656399
            },
            water: {
                color0: 16290672,
                color1: 11038311
            },
            sky: {
                color0: 15649656,
                color1: 12539735
            },
            fog: {
                color0: 14458731,
            }
        },
        night: {
            terrain: {
                color0: 11859,
                color1: 6774907
            },
            water: {
                color0: 1592661,
                color1: 10821
            },
            sky: {
                color0: 5323868,
                color1: 1373
            },
            fog: {
                color0: 3089756,
            }
        }
    };
    this.ORB_COLORS = {
        green: 4840286,
        blue: 4812763,
        red: 14371145,
    }
}, "Static");
window.ASSETS = ["assets/images/common/end.png", "assets/images/common/noise.jpg", "assets/images/common/particle.png", "assets/images/favicon.png", "assets/images/landing/loader/bg.png", "assets/images/landing/loader/ring.png", "assets/images/landing/loader/solid.png", "assets/images/landing/loader/top.png", "assets/images/landing/logo.png", "assets/images/orb/flare.png", "assets/images/orb/particle.png", "assets/images/share.jpg", "assets/images/space/palette.jpg", "assets/images/space/star.png", "assets/js/lib/three.min.js", "assets/shaders/Meteor.fs", "assets/shaders/Meteor.vs", "assets/shaders/OrbBulb.fs", "assets/shaders/OrbBulb.vs", "assets/shaders/OrbCenter.fs", "assets/shaders/OrbCenter.vs", "assets/shaders/OrbFlare.fs", "assets/shaders/OrbFlare.vs", "assets/shaders/SpaceDistance.fs", "assets/shaders/SpaceDistance.vs", "assets/shaders/SpacePainter.fs", "assets/shaders/SpacePainter.vs", "assets/shaders/Terrain.fs", "assets/shaders/Terrain.vs", "assets/shaders/TerrainSky.fs", "assets/shaders/TerrainSky.vs", "assets/shaders/Trail.fs", "assets/shaders/Trail.vs", "assets/shaders/Water.fs", "assets/shaders/Water.vs", "assets/geometry/t0.json", "assets/geometry/t1.json", "assets/geometry/t10.json", "assets/geometry/t11.json", "assets/geometry/t2.json", "assets/geometry/t3.json", "assets/geometry/t4.json", "assets/geometry/t5.json", "assets/geometry/t6.json", "assets/geometry/t7.json", "assets/geometry/t8.json", "assets/geometry/t9.json"];
Class(function HomeEvents() {
    var a = this;
    this.SCALE_ORB = "scale_orb";
    this.START_PAINTER = "start_painter";
    this.START_STARS = "start_stars";
    this.START_TERRAIN = "start_terrain";
    this.START_EXP = "start_exp";
    this.METEORS_START = "meteors_start";
    this.METEORS_STOP = "meteors_stop";
    this.ENTER_SPACE = "enter_space";
    this.REPLAY = "replay";
    this.TEST_REFLECTION = "test_reflection";
    this.REFLECTION_COMPLETE = "reflection_complete";
    this.STARS_READY = "stars_ready";
    this.ENDING_WATER = "ending_water";
    this.TEST_RETINA = "test_retina"
}, "Static");
Class(function Random3DRotation(b) {
    var e = this;
    var c = ["x", "y", "z"];
    var a;
    (function() {
        d()
    })();

    function d() {
        a = {};
        a.x = Utils.doRandom(0, 2);
        a.y = Utils.doRandom(0, 2);
        a.z = Utils.doRandom(0, 2);
        a.vx = Utils.doRandom(-5, 5) * 0.0025;
        a.vy = Utils.doRandom(-5, 5) * 0.0025;
        a.vz = Utils.doRandom(-5, 5) * 0.0025
    }
    this.update = function(h) {
        for (var g = 0; g < 3; g++) {
            var f = c[g];
            switch (a[f]) {
                case 0:
                    b.rotation[f] += Math.cos(Math.sin(h * 0.25)) * a["v" + f];
                    break;
                case 1:
                    b.rotation[f] += Math.cos(Math.sin(h * 0.25)) * a["v" + f];
                    break;
                case 2:
                    b.rotation[f] += Math.cos(Math.cos(h * 0.25)) * a["v" + f];
                    break
            }
        }
    }
});
Class(function PausableTimer() {
    var d = this;
    var c;
    var b = [];

    function a(g, e, f) {
        return setTimeout(function() {
            g(f)
        }, e)
    }
    this.delayedCall = function(k, f, g, j) {
        var h = a(k, f, g);
        var e = {};
        e.timer = h;
        e.start = Date.now();
        e.end = Date.now() + f;
        e.time = f;
        e.callback = k;
        e.params = g;
        j = j || b;
        j.push(e);
        if (c) {
            clearTimeout(h);
            e.elapsed = 0;
            e.remaining = e.time
        }
        return h
    };
    this.pause = function() {
        c = true;
        for (var f = 0; f < b.length; f++) {
            var e = b[f];
            clearTimeout(e.timer);
            e.elapsed = Date.now() - e.start;
            e.remaining = e.time - e.elapsed
        }
    };
    this.resume = function() {
        c = false;
        var g = [];
        for (var f = 0; f < b.length; f++) {
            var e = b[f];
            if (e.remaining > 0) {
                g.push(e)
            }
        }
        b.length = 0;
        for (f = 0; f < g.length; f++) {
            e = g[f];
            this.delayedCall(e.callback, e.remaining, e.params)
        }
    }
});
Class(function Data() {
    Inherit(this, Model);
    var a = this;
    (function() {})()
}, "Static");
Data.Class(function Timing() {
    Inherit(this, Model);
    Inherit(this, PausableTimer);
    var c = this;
    var m, f, a;
    this.multipleTweens = true;
    this.moveSpeed = 50;
    this.orbRadius = 2000;
    this.terrainHeight = 0.7;
    this.cameraDistance = Device.mobile || Device.browser.safari ? 1250 : 2000;
    this.shakeAmount = 0;
    this.skyTransition = 0;
    this.aperture = 0.04;
    this.cameraDip = true;
    this.startVertex = 0.05;
    this.snowMult = 4;
    this.centerStars = 0;
    (function() {
        d()
    })();

    function e() {
        TweenManager.tween(c, {
            moveSpeed: 100
        }, 10000, "easeInCubic", function() {
            Data.Color.transitionOrb("blue", 5000);
            j();
            c.delayedCall(g, 28000)
        })
    }

    function b() {
        TweenManager.tween(c, {
            orbRadius: 1000
        }, 2000, "easeInOutCubic", 15000)
    }

    function g() {
        c.events.fire(HomeEvents.METEORS_START);
        c.delayedCall(function() {
            Data.Color.transitionOrb("red", 15000);
            Data.Color.transition("dusk");
            c.delayedCall(k, 30000)
        }, 2000)
    }

    function k() {
        a = true;
        c.events.fire(HomeEvents.METEORS_STOP);
        Data.Color.transitionOrb("blue", 15000);
        Data.Color.transition("night");
        TweenManager.tween(c, {
            moveSpeed: 75
        }, 15000, "easeInOutCubic");
        m.stop();
        TweenManager.tween(c, {
            terrainHeight: 1.3
        }, 20000, "easeInOutCubic");
        c.delayedCall(h, 20000)
    }

    function j() {
        m = TweenManager.tween(c, {
            terrainHeight: 1.3
        }, 1100000, "easeInOutCubic");
        TweenManager.tween(c, {
            startVertex: 0.2
        }, 2000, "easeInOutCubic", 9000);
        TweenManager.tween(c, {
            snowMult: 1
        }, 2000, "easeInOutCubic", 15000)
    }

    function h() {
        c.cameraDip = false;
        c.delayedCall(function() {
            c.events.fire(HomeEvents.START_PAINTER);
            c.delayedCall(function() {
                c.events.fire(HomeEvents.SCALE_ORB)
            }, 1000)
        }, 4000);
        TweenManager.tween(c, {
            moveSpeed: 200
        }, 5000, "easeInCubic");
        TweenManager.tween(c, {
            aperture: 0
        }, 3000, "easeInOutCubic");
        c.events.fire(HomeEvents.ENTER_SPACE);
        TweenManager.tween(c, {
            skyTransition: 1
        }, 4000, "easeInOutSine", 3000, function() {
            c.events.fire(HomeEvents.START_STARS)
        })
    }

    function d() {
        c.events.subscribe(HydraEvents.BROWSER_FOCUS, l)
    }

    function l(n) {
        if (n.type == "focus") {
            c.resume()
        } else {
            c.pause()
        }
    }
    this.startRendering = function() {
        c.events.fire(HomeEvents.START_TERRAIN)
    };
    this.start = function() {
        e();
        b();
        c.events.fire(HomeEvents.START_EXP);
        Data.Sound.play()
    };
    this.replay = function() {
        Data.Color.quickChange("day");
        Data.Color.quickChangeOrb("green");
        this.multipleTweens = true;
        this.moveSpeed = 50;
        this.orbRadius = 2000;
        this.terrainHeight = 0.7;
        this.cameraDistance = 2500;
        this.shakeAmount = 0;
        this.skyTransition = 0;
        this.aperture = 0.04;
        this.cameraDip = true;
        this.startVertex = 0;
        this.snowMult = 4;
        this.centerStars = false;
        c.events.fire(HomeEvents.REPLAY);
        c.events.fire(HomeEvents.START_TERRAIN);
        this.start()
    };
    this.meteorHit = function() {
        if (a) {
            return
        }
        this.shakeAmount = 1;
        if (f) {
            f = f.stop()
        }
        f = TweenManager.tween(c, {
            shakeAmount: 0
        }, 300, "easeOutCubic")
    };
    this.runOutOfStars = function() {
        TweenManager.tween(c, {
            centerStars: 1
        }, 5000, "easeInOutCubic");
        c.delayedCall(function() {
            EndView.instance().animateIn()
        }, Device.mobile ? 10000 : 30000)
    }
});
Data.Class(function Textures() {
    Inherit(this, Model);
    var b = this;
    var a = {};
    (function() {})();
    this.getTexture = function(c) {
        if (!a[c]) {
            a[c] = THREE.ImageUtils.loadTexture(Config.PROXY + c)
        }
        return a[c]
    }
});
Data.Class(function Sound() {
    Inherit(this, Model);
    var e = this;
    var d;
    (function() {
        Hydra.ready(c);
        b()
    })();

    function c() {
        d = new Howl({
            urls: [Config.CDN + "assets/audio/awake.mp3", Config.CDN + "assets/audio/awake.ogg"]
        })
    }

    function b() {
        e.events.subscribe(HydraEvents.BROWSER_FOCUS, a)
    }

    function a(f) {
        if (f.type == "focus") {
            d.play()
        } else {
            d.pause()
        }
    }
    this.play = function() {
        d.play()
    }
});
! function() {
    var x = {},
        C = null,
        k = !0,
        b = !1;
    try {
        "undefined" != typeof AudioContext ? C = new AudioContext : "undefined" != typeof webkitAudioContext ? C = new webkitAudioContext : k = !1
    } catch (q) {
        k = !1
    }
    if (!k) {
        if ("undefined" != typeof Audio) {
            try {
                new Audio
            } catch (q) {
                b = !0
            }
        } else {
            b = !0
        }
    }
    if (k) {
        var D = void 0 === C.createGain ? C.createGainNode() : C.createGain();
        D.gain.value = 1, D.connect(C.destination)
    }
    var j = function(a) {
        this._volume = 1, this._muted = !1, this.usingWebAudio = k, this.ctx = C, this.noAudio = b, this._howls = [], this._codecs = a, this.iOSAutoEnable = !0
    };
    j.prototype = {
        volume: function(f) {
            var c = this;
            if (f = parseFloat(f), f >= 0 && 1 >= f) {
                c._volume = f, k && (D.gain.value = f);
                for (var d in c._howls) {
                    if (c._howls.hasOwnProperty(d) && c._howls[d]._webAudio === !1) {
                        for (var a = 0; a < c._howls[d]._audioNode.length; a++) {
                            c._howls[d]._audioNode[a].volume = c._howls[d]._volume * c._volume
                        }
                    }
                }
                return c
            }
            return k ? D.gain.value : c._volume
        },
        mute: function() {
            return this._setMuted(!0), this
        },
        unmute: function() {
            return this._setMuted(!1), this
        },
        _setMuted: function(f) {
            var c = this;
            c._muted = f, k && (D.gain.value = f ? 0 : c._volume);
            for (var d in c._howls) {
                if (c._howls.hasOwnProperty(d) && c._howls[d]._webAudio === !1) {
                    for (var a = 0; a < c._howls[d]._audioNode.length; a++) {
                        c._howls[d]._audioNode[a].muted = f
                    }
                }
            }
        },
        codecs: function(a) {
            return this._codecs[a]
        },
        _enableiOSAudio: function() {
            var a = this;
            if (!C || !a._iOSEnabled && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                a._iOSEnabled = !1;
                var c = function() {
                    var e = C.createBuffer(1, 1, 22050),
                        d = C.createBufferSource();
                    d.buffer = e, d.connect(C.destination), void 0 === d.start ? d.noteOn(0) : d.start(0), setTimeout(function() {
                        (d.playbackState === d.PLAYING_STATE || d.playbackState === d.FINISHED_STATE) && (a._iOSEnabled = !0, a.iOSAutoEnable = !1, window.removeEventListener("touchstart", c, !1))
                    }, 0)
                };
                return window.addEventListener("touchstart", c, !1), a
            }
        }
    };
    var B = null,
        A = {};
    b || (B = new Audio, A = {
        mp3: !!B.canPlayType("audio/mpeg;").replace(/^no$/, ""),
        opus: !!B.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
        ogg: !!B.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
        wav: !!B.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ""),
        aac: !!B.canPlayType("audio/aac;").replace(/^no$/, ""),
        m4a: !!(B.canPlayType("audio/x-m4a;") || B.canPlayType("audio/m4a;") || B.canPlayType("audio/aac;")).replace(/^no$/, ""),
        mp4: !!(B.canPlayType("audio/x-mp4;") || B.canPlayType("audio/mp4;") || B.canPlayType("audio/aac;")).replace(/^no$/, ""),
        weba: !!B.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")
    });
    var w = new j(A),
        m = function(c) {
            var a = this;
            a._autoplay = c.autoplay || !1, a._buffer = c.buffer || !1, a._duration = c.duration || 0, a._format = c.format || null, a._loop = c.loop || !1, a._loaded = !1, a._sprite = c.sprite || {}, a._src = c.src || "", a._pos3d = c.pos3d || [0, 0, -0.5], a._volume = void 0 !== c.volume ? c.volume : 1, a._urls = c.urls || [], a._rate = c.rate || 1, a._model = c.model || null, a._onload = [c.onload || function() {}], a._onloaderror = [c.onloaderror || function() {}], a._onend = [c.onend || function() {}], a._onpause = [c.onpause || function() {}], a._onplay = [c.onplay || function() {}], a._onendTimer = [], a._webAudio = k && !a._buffer, a._audioNode = [], a._webAudio && a._setupAudioNode(), void 0 !== C && C && w.iOSAutoEnable && w._enableiOSAudio(), w._howls.push(a), a.load()
        };
    if (m.prototype = {
            load: function() {
                var o = this,
                    f = null;
                if (b) {
                    return void o.on("loaderror")
                }
                for (var p = 0; p < o._urls.length; p++) {
                    var d, h;
                    if (o._format) {
                        d = o._format
                    } else {
                        if (h = o._urls[p], d = /^data:audio\/([^;,]+);/i.exec(h), d || (d = /\.([^.]+)$/.exec(h.split("?", 1)[0])), !d) {
                            return void o.on("loaderror")
                        }
                        d = d[1].toLowerCase()
                    }
                    if (A[d]) {
                        f = o._urls[p];
                        break
                    }
                }
                if (!f) {
                    return void o.on("loaderror")
                }
                if (o._src = f, o._webAudio) {
                    z(o, f)
                } else {
                    var c = new Audio;
                    c.addEventListener("error", function() {
                        c.error && 4 === c.error.code && (j.noAudio = !0), o.on("loaderror", {
                            type: c.error ? c.error.code : 0
                        })
                    }, !1), o._audioNode.push(c), c.src = f, c._pos = 0, c.preload = "auto", c.volume = w._muted ? 0 : o._volume * w.volume();
                    var a = function() {
                        o._duration = Math.ceil(10 * c.duration) / 10, 0 === Object.getOwnPropertyNames(o._sprite).length && (o._sprite = {
                            _default: [0, 1000 * o._duration]
                        }), o._loaded || (o._loaded = !0, o.on("load")), o._autoplay && o.play(), c.removeEventListener("canplaythrough", a, !1)
                    };
                    c.addEventListener("canplaythrough", a, !1), c.load()
                }
                return o
            },
            urls: function(c) {
                var a = this;
                return c ? (a.stop(), a._urls = "string" == typeof c ? [c] : c, a._loaded = !1, a.load(), a) : a._urls
            },
            play: function(c, d) {
                var a = this;
                return "function" == typeof c && (d = c), c && "function" != typeof c || (c = "_default"), a._loaded ? a._sprite[c] ? (a._inactiveNode(function(p) {
                    p._sprite = c;
                    var t = p._pos > 0 ? p._pos : a._sprite[c][0] / 1000,
                        E = 0;
                    a._webAudio ? (E = a._sprite[c][1] / 1000 - p._pos, p._pos > 0 && (t = a._sprite[c][0] / 1000 + t)) : E = a._sprite[c][1] / 1000 - (t - a._sprite[c][0] / 1000);
                    var n, f = !(!a._loop && !a._sprite[c][2]),
                        e = "string" == typeof d ? d : Math.round(Date.now() * Math.random()) + "";
                    if (function() {
                            var h = {
                                id: e,
                                sprite: c,
                                loop: f
                            };
                            n = setTimeout(function() {
                                !a._webAudio && f && a.stop(h.id).play(c, h.id), a._webAudio && !f && (a._nodeById(h.id).paused = !0, a._nodeById(h.id)._pos = 0, a._clearEndTimer(h.id)), a._webAudio || f || a.stop(h.id), a.on("end", e)
                            }, 1000 * E), a._onendTimer.push({
                                timer: n,
                                id: h.id
                            })
                        }(), a._webAudio) {
                        var F = a._sprite[c][0] / 1000,
                            r = a._sprite[c][1] / 1000;
                        p.id = e, p.paused = !1, y(a, [f, F, r], e), a._playStart = C.currentTime, p.gain.value = a._volume, void 0 === p.bufferSource.start ? p.bufferSource.noteGrainOn(0, t, E) : p.bufferSource.start(0, t, E)
                    } else {
                        if (4 !== p.readyState && (p.readyState || !navigator.isCocoonJS)) {
                            return a._clearEndTimer(e),
                                function() {
                                    var G = a,
                                        H = c,
                                        I = d,
                                        l = p,
                                        h = function() {
                                            G.play(H, I), l.removeEventListener("canplaythrough", h, !1)
                                        };
                                    l.addEventListener("canplaythrough", h, !1)
                                }(), a
                        }
                        p.readyState = 4, p.id = e, p.currentTime = t, p.muted = w._muted || p.muted, p.volume = a._volume * w.volume(), setTimeout(function() {
                            p.play()
                        }, 0)
                    }
                    return a.on("play"), "function" == typeof d && d(e), a
                }), a) : ("function" == typeof d && d(), a) : (a.on("load", function() {
                    a.play(c, d)
                }), a)
            },
            pause: function(c) {
                var a = this;
                if (!a._loaded) {
                    return a.on("play", function() {
                        a.pause(c)
                    }), a
                }
                a._clearEndTimer(c);
                var d = c ? a._nodeById(c) : a._activeNode();
                if (d) {
                    if (d._pos = a.pos(null, c), a._webAudio) {
                        if (!d.bufferSource || d.paused) {
                            return a
                        }
                        d.paused = !0, void 0 === d.bufferSource.stop ? d.bufferSource.noteOff(0) : d.bufferSource.stop(0)
                    } else {
                        d.pause()
                    }
                }
                return a.on("pause"), a
            },
            stop: function(c) {
                var a = this;
                if (!a._loaded) {
                    return a.on("play", function() {
                        a.stop(c)
                    }), a
                }
                a._clearEndTimer(c);
                var d = c ? a._nodeById(c) : a._activeNode();
                if (d) {
                    if (d._pos = 0, a._webAudio) {
                        if (!d.bufferSource || d.paused) {
                            return a
                        }
                        d.paused = !0, void 0 === d.bufferSource.stop ? d.bufferSource.noteOff(0) : d.bufferSource.stop(0)
                    } else {
                        isNaN(d.duration) || (d.pause(), d.currentTime = 0)
                    }
                }
                return a
            },
            mute: function(c) {
                var a = this;
                if (!a._loaded) {
                    return a.on("play", function() {
                        a.mute(c)
                    }), a
                }
                var d = c ? a._nodeById(c) : a._activeNode();
                return d && (a._webAudio ? d.gain.value = 0 : d.muted = !0), a
            },
            unmute: function(c) {
                var a = this;
                if (!a._loaded) {
                    return a.on("play", function() {
                        a.unmute(c)
                    }), a
                }
                var d = c ? a._nodeById(c) : a._activeNode();
                return d && (a._webAudio ? d.gain.value = a._volume : d.muted = !1), a
            },
            volume: function(d, a) {
                var f = this;
                if (d = parseFloat(d), d >= 0 && 1 >= d) {
                    if (f._volume = d, !f._loaded) {
                        return f.on("play", function() {
                            f.volume(d, a)
                        }), f
                    }
                    var c = a ? f._nodeById(a) : f._activeNode();
                    return c && (f._webAudio ? c.gain.value = d : c.volume = d * w.volume()), f
                }
                return f._volume
            },
            loop: function(c) {
                var a = this;
                return "boolean" == typeof c ? (a._loop = c, a) : a._loop
            },
            sprite: function(c) {
                var a = this;
                return "object" == typeof c ? (a._sprite = c, a) : a._sprite
            },
            pos: function(f, h) {
                var d = this;
                if (!d._loaded) {
                    return d.on("load", function() {
                        d.pos(f)
                    }), "number" == typeof f ? d : d._pos || 0
                }
                f = parseFloat(f);
                var a = h ? d._nodeById(h) : d._activeNode();
                if (a) {
                    return f >= 0 ? (d.pause(h), a._pos = f, d.play(a._sprite, h), d) : d._webAudio ? a._pos + (C.currentTime - d._playStart) : a.currentTime
                }
                if (f >= 0) {
                    return d
                }
                for (var c = 0; c < d._audioNode.length; c++) {
                    if (d._audioNode[c].paused && 4 === d._audioNode[c].readyState) {
                        return d._webAudio ? d._audioNode[c]._pos : d._audioNode[c].currentTime
                    }
                }
            },
            pos3d: function(h, c, l, f) {
                var a = this;
                if (c = void 0 !== c && c ? c : 0, l = void 0 !== l && l ? l : -0.5, !a._loaded) {
                    return a.on("play", function() {
                        a.pos3d(h, c, l, f)
                    }), a
                }
                if (!(h >= 0 || 0 > h)) {
                    return a._pos3d
                }
                if (a._webAudio) {
                    var d = f ? a._nodeById(f) : a._activeNode();
                    d && (a._pos3d = [h, c, l], d.panner.setPosition(h, c, l), d.panner.panningModel = a._model || "HRTF")
                }
                return a
            },
            fade: function(G, J, h, c, E) {
                var K = this,
                    d = Math.abs(G - J),
                    I = G > J ? "down" : "up",
                    H = d / 0.01,
                    F = h / H;
                if (!K._loaded) {
                    return K.on("load", function() {
                        K.fade(G, J, h, c, E)
                    }), K
                }
                K.volume(G, E);
                for (var p = 1; H >= p; p++) {
                    ! function() {
                        var a = K._volume + ("up" === I ? 0.01 : -0.01) * p,
                            l = Math.round(1000 * a) / 1000,
                            f = J;
                        setTimeout(function() {
                            K.volume(l, E), l === f && c && c()
                        }, F * p)
                    }()
                }
            },
            fadeIn: function(c, a, d) {
                return this.volume(0).play().fade(0, c, a, d)
            },
            fadeOut: function(f, c, h, d) {
                var a = this;
                return a.fade(a._volume, f, c, function() {
                    h && h(), a.pause(d), a.on("end")
                }, d)
            },
            _nodeById: function(d) {
                for (var a = this, f = a._audioNode[0], c = 0; c < a._audioNode.length; c++) {
                    if (a._audioNode[c].id === d) {
                        f = a._audioNode[c];
                        break
                    }
                }
                return f
            },
            _activeNode: function() {
                for (var c = this, a = null, d = 0; d < c._audioNode.length; d++) {
                    if (!c._audioNode[d].paused) {
                        a = c._audioNode[d];
                        break
                    }
                }
                return c._drainPool(), a
            },
            _inactiveNode: function(h) {
                for (var c = this, p = null, f = 0; f < c._audioNode.length; f++) {
                    if (c._audioNode[f].paused && 4 === c._audioNode[f].readyState) {
                        h(c._audioNode[f]), p = !0;
                        break
                    }
                }
                if (c._drainPool(), !p) {
                    var a;
                    if (c._webAudio) {
                        a = c._setupAudioNode(), h(a)
                    } else {
                        c.load(), a = c._audioNode[c._audioNode.length - 1];
                        var d = navigator.isCocoonJS ? "canplaythrough" : "loadedmetadata",
                            l = function() {
                                a.removeEventListener(d, l, !1), h(a)
                            };
                        a.addEventListener(d, l, !1)
                    }
                }
            },
            _drainPool: function() {
                var c, a = this,
                    d = 0;
                for (c = 0; c < a._audioNode.length; c++) {
                    a._audioNode[c].paused && d++
                }
                for (c = a._audioNode.length - 1; c >= 0 && !(5 >= d); c--) {
                    a._audioNode[c].paused && (a._webAudio && a._audioNode[c].disconnect(0), d--, a._audioNode.splice(c, 1))
                }
            },
            _clearEndTimer: function(f) {
                for (var c = this, h = 0, d = 0; d < c._onendTimer.length; d++) {
                    if (c._onendTimer[d].id === f) {
                        h = d;
                        break
                    }
                }
                var a = c._onendTimer[h];
                a && (clearTimeout(a.timer), c._onendTimer.splice(h, 1))
            },
            _setupAudioNode: function() {
                var c = this,
                    d = c._audioNode,
                    a = c._audioNode.length;
                return d[a] = void 0 === C.createGain ? C.createGainNode() : C.createGain(), d[a].gain.value = c._volume, d[a].paused = !0, d[a]._pos = 0, d[a].readyState = 4, d[a].connect(D), d[a].panner = C.createPanner(), d[a].panner.panningModel = c._model || "equalpower", d[a].panner.setPosition(c._pos3d[0], c._pos3d[1], c._pos3d[2]), d[a].panner.connect(d[a]), d[a]
            },
            on: function(f, c) {
                var h = this,
                    d = h["_on" + f];
                if ("function" == typeof c) {
                    d.push(c)
                } else {
                    for (var a = 0; a < d.length; a++) {
                        c ? d[a].call(h, c) : d[a].call(h)
                    }
                }
                return h
            },
            off: function(h, c) {
                var l = this,
                    f = l["_on" + h],
                    a = c ? "" + c : null;
                if (a) {
                    for (var d = 0; d < f.length; d++) {
                        if (a === "" + f[d]) {
                            f.splice(d, 1);
                            break
                        }
                    }
                } else {
                    l["_on" + h] = []
                }
                return l
            },
            unload: function() {
                for (var c = this, e = c._audioNode, d = 0; d < c._audioNode.length; d++) {
                    e[d].paused || (c.stop(e[d].id), c.on("end", e[d].id)), c._webAudio ? e[d].disconnect(0) : e[d].src = ""
                }
                for (d = 0; d < c._onendTimer.length; d++) {
                    clearTimeout(c._onendTimer[d].timer)
                }
                var a = w._howls.indexOf(c);
                null !== a && a >= 0 && w._howls.splice(a, 1), delete x[c._src], c = null
            }
        }, k) {
        var z = function(d, l) {
                if (l in x) {
                    return d._duration = x[l].duration, void g(d)
                }
                if (/^data:[^;]+;base64,/.test(l)) {
                    for (var f = atob(l.split(",")[1]), c = new Uint8Array(f.length), e = 0; e < f.length; ++e) {
                        c[e] = f.charCodeAt(e)
                    }
                    v(c.buffer, d, l)
                } else {
                    var h = new XMLHttpRequest;
                    h.open("GET", l, !0), h.responseType = "arraybuffer", h.onload = function() {
                        v(h.response, d, l)
                    }, h.onerror = function() {
                        d._webAudio && (d._buffer = !0, d._webAudio = !1, d._audioNode = [], delete d._gainNode, delete x[l], d.load())
                    };
                    try {
                        h.send()
                    } catch (a) {
                        h.onerror()
                    }
                }
            },
            v = function(d, c, a) {
                C.decodeAudioData(d, function(e) {
                    e && (x[a] = e, g(c, e))
                }, function() {
                    c.on("loaderror")
                })
            },
            g = function(c, a) {
                c._duration = a ? a.duration : c._duration, 0 === Object.getOwnPropertyNames(c._sprite).length && (c._sprite = {
                    _default: [0, 1000 * c._duration]
                }), c._loaded || (c._loaded = !0, c.on("load")), c._autoplay && c.play()
            },
            y = function(e, d, a) {
                var c = e._nodeById(a);
                c.bufferSource = C.createBufferSource(), c.bufferSource.buffer = x[e._src], c.bufferSource.connect(c.panner), c.bufferSource.loop = d[0], d[0] && (c.bufferSource.loopStart = d[1], c.bufferSource.loopEnd = d[1] + d[2]), c.bufferSource.playbackRate.value = e._rate
            }
    }
    "function" == typeof define && define.amd && define(function() {
        return {
            Howler: w,
            Howl: m
        }
    }), "undefined" != typeof exports && (exports.Howler = w, exports.Howl = m), "undefined" != typeof window && (window.Howler = w, window.Howl = m)
}();
Data.Class(function Color() {
    Inherit(this, Model);
    var h = this;
    var g = {};
    var e, a, c, f;

    function b() {
        var n = Config.COLORS;
        for (var p in n) {
            var q = n[p];
            for (var o in q) {
                var r = q[o];
                for (var m in r) {
                    r[m] = new THREE.Color(r[m])
                }
            }
        }
    }

    function k() {
        var m = Config.COLORS[Config.START_COLOR];
        for (var o in m) {
            var p = m[o];
            g[o] = {};
            for (var n in p) {
                g[o][n] = new THREE.Color(p[n])
            }
        }
        m = Config.ORB_COLORS;
        for (o in m) {
            m[o] = new THREE.Color(m[o])
        }
    }

    function d() {
        c = new THREE.Color().copy(Config.ORB_COLORS.green);
        f = new THREE.Vector3();
        j()
    }

    function l(n) {
        for (var o in e) {
            var m = e[o];
            for (var p in m) {
                g[o][p].lerp(m[p], n)
            }
        }
    }

    function j() {
        var m = c.getHSL();
        f.set(m.h, m.s, m.l)
    }
    this.init = function() {
        k();
        d();
        b()
    };
    this.getColor = function(m, n) {
        return g[m][n]
    };
    this.getOrbColor = function() {
        return c
    };
    this.getOrbHSL = function() {
        return f
    };
    this.quickChange = function(m) {
        e = Config.COLORS[m];
        l(1)
    };
    this.quickChangeOrb = function(m) {
        m = Config.ORB_COLORS[m];
        c.lerp(m, 1);
        j()
    };
    this.transition = function(m) {
        if (a && a.stop) {
            a.stop()
        }
        e = Config.COLORS[m];
        var n = new DynamicObject({
            v: 0
        });
        a = n.tween({
            v: 1
        }, 30000, "easeInOutCubic", function() {
            l(n.v)
        })
    };
    this.transitionOrb = function(m, o) {
        m = Config.ORB_COLORS[m];
        var n = new DynamicObject({
            v: 0
        });
        n.tween({
            v: 1
        }, o, "easeInOutCubic", function() {
            c.lerp(m, n.v);
            j()
        })
    }
});
Class(function Terrestrial() {
    Inherit(this, Controller);
    var o = this;
    var u, m, p, h, j;
    var l, b;
    var v = new THREE.Vector3();
    this.object3D = new THREE.Object3D();
    (function() {
        r();
        a();
        n();
        t();
        e();
        d();
        k()
    })();

    function r() {
        p = o.initClass(TerrestrialLight)
    }

    function a() {
        j = o.initClass(TerrestrialSky);
        o.object3D.add(j.mesh)
    }

    function n() {
        h = o.initClass(TerrestrialWater, p);
        o.object3D.add(h.object3D)
    }

    function t() {
        m = o.initClass(TerrestrialTerrain, p);
        o.object3D.add(m.object3D)
    }

    function e() {
        l = o.initClass(TerrestrialMeteors);
        o.object3D.add(l.object3D)
    }

    function d() {
        u = o.initClass(TerrestrialInteraction);
        u.camera = Camera.instance().worldCamera;
        u.terrains = m.terrains;
        u.terrain = m
    }

    function s(w) {
        v.x = Utils.doRandom(-100, 100) * Data.Timing.shakeAmount;
        v.y = o.object3D.position.y;
        v.z = o.object3D.position.z;
        if (!b) {
            o.object3D.position.y = Utils.clamp(Math.sin(w * 0.00025) * -1200, -1200, 0)
        }
    }

    function k() {
        o.events.subscribe(HomeEvents.ENTER_SPACE, q);
        o.events.subscribe(HomeEvents.START_STARS, f);
        o.events.subscribe(HomeEvents.START_TERRAIN, g);
        o.events.subscribe(HomeEvents.REPLAY, c)
    }

    function c() {
        b = false;
        o.object3D.position.y = 0
    }

    function f() {
        u.stop();
        h.stop();
        Render.stopRender(s)
    }

    function g() {
        h.start();
        u.start();
        Render.startRender(s)
    }

    function q() {
        b = true;
        TweenManager.tween(o.object3D.position, {
            y: -25000
        }, 8000, "easeInOutCubic")
    }
});
Class(function Space(c) {
    Inherit(this, Controller);
    var f = this;
    var e, a;
    this.object3D = new THREE.Object3D();
    (function() {
        b();
        d()
    })();

    function b() {
        a = f.initClass(SpaceDistance);
        f.object3D.add(a.object3D)
    }

    function d() {
        e = f.initClass(SpacePainter, c);
        f.object3D.add(e.mesh)
    }
});
Class(function OrbScene() {
    Inherit(this, Component);
    var g = this;
    var b, c;
    var f = Camera.instance().worldCamera;
    (function() {
        d();
        e();
        Renderer.instance().start(a)
    })();

    function d() {
        b = new THREE.Scene()
    }

    function e() {
        c = new Orb(b)
    }

    function a(j, h) {
        c.update(h);
        j.render(b, f)
    }
}, "Singleton");
Class(function MainScene() {
    Inherit(this, Controller);
    var h = this;
    var k, o, c;
    var b, e;
    var a = Camera.instance().worldCamera;
    (function() {
        d();
        m();
        g();
        j();
        Renderer.instance().start(f)
    })();

    function g() {
        e = h.initClass(Orb, k)
    }

    function l() {
        c = new THREE.PerspectiveCamera(40, Stage.width / Stage.height, 5, 50000);
        c.controls = new THREE.TrackballControls(c);
        c.position.z = 300;
        Global.CAMERA = c
    }

    function d() {
        k = new THREE.Scene()
    }

    function m() {
        o = new Terrestrial();
        k.add(o.object3D)
    }

    function n(p) {
        b = new Space(p.disable);
        k.add(b.object3D);
        h.events.fire(HomeEvents.STARS_READY)
    }

    function f(q, p) {
        if (c) {
            c.controls.update()
        }
        e.update(p)
    }

    function j() {
        h.events.subscribe(HomeEvents.REFLECTION_COMPLETE, n)
    }
    this.get("scene", function() {
        return k
    })
}, "Singleton");
Class(function Renderer() {
    Inherit(this, Controller);
    var d = this;
    var j;
    var g;
    var e = [];
    (function() {
        b();
        h();
        f();
        a();
        Render.startRender(c)
    })();

    function b() {
        j = d.container;
        j.size("100%");
        Stage.add(j)
    }

    function h() {
        g = new THREE.WebGLRenderer({
            antialias: false
        });
        j.add(g.domElement)
    }

    function c(l, m, n) {
        for (var k = 0; k < e.length; k++) {
            e[k](g, l, m, n)
        }
    }

    function f() {
        d.events.subscribe(HydraEvents.RESIZE, a)
    }

    function a() {
        if (!Device.system.retina || (Device.mobile && !Global.KILL_RETINA) || Device.detect("cros")) {
            g.setSize(Stage.width, Stage.height)
        } else {
            g.setSize(Stage.width / 2, Stage.height / 2);
            g.setViewport(0, 0, Stage.width / 2, Stage.height / 2);
            g.domElement.style.width = Stage.width + "px";
            g.domElement.style.height = Stage.height + "px"
        }
    }
    this.get("r", function() {
        return g
    });
    this.start = function(k) {
        e.push(k)
    };
    this.startAt = function(l, k) {
        e.splice(k, 0, l)
    };
    this.stop = function(k) {
        e.findAndRemove(k)
    }
}, "Singleton");
Class(function Orb(b) {
    Inherit(this, Controller);
    var g = this;
    var e, d;
    var a = new THREE.Vector3();
    (function() {
        c();
        f()
    })();

    function c() {
        e = g.initClass(OrbPulser, a);
        b.add(e.object3D)
    }

    function f() {
        d = g.initClass(OrbTrail, a);
        b.add(d.object3D)
    }
    this.update = function(h) {
        a.lerp(Camera.instance().mouse, 0.5);
        e.update(h);
        d.update(h)
    }
});
Class(function Loader() {
    Inherit(this, Controller);
    var k = this;
    var o;
    var j, f, h;
    (function() {
        g();
        d();
        n();
        l()
    })();

    function g() {
        o = k.container;
        o.size("100%").setZ(9999);
        Stage.add(o)
    }

    function d() {
        j = k.initClass(LandingView);
        j.events.add(HydraEvents.CLICK, e)
    }

    function n() {
        if (!Device.graphics.webgl) {
            return
        }
        var q = [];
        for (var p = 0; p < ASSETS.length; p++) {
            q.push(Config.CDN + ASSETS[p])
        }
        f = k.initClass(AssetLoader, q);
        f.events.add(HydraEvents.PROGRESS, a);
        f.add(Device.mobile ? 5 : 4);
        f.add(1);
        setTimeout(function() {
            f.trigger(1)
        }, 500)
    }

    function b() {
        if (h) {
            return
        }
        h = true;
        Data.Color.init();
        Renderer.instance();
        MainScene.instance();
        FXComposer.instance();
        Data.Timing.startRendering()
    }

    function l() {
        k.events.subscribe(HomeEvents.TEST_REFLECTION, m);
        k.events.subscribe(HomeEvents.REFLECTION_COMPLETE, m);
        k.events.subscribe(HomeEvents.STARS_READY, c)
    }

    function m() {
        f.trigger(1)
    }

    function c() {
        f.trigger(2);
        if (Device.mobile) {
            k.events.fire(HomeEvents.TEST_RETINA);
            setTimeout(function() {
                f.trigger(1)
            }, 550)
        }
    }

    function e() {
        if (Mobile.os == "Android") {
            Device.openFullscreen()
        }
        __body.css({
            cursor: "none"
        });
        GATracker.trackPage("start");
        Data.Timing.start();
        j.animateOut();
        setTimeout(function() {
            k.events.fire(HydraEvents.COMPLETE)
        }, 4000)
    }

    function a(p) {
        j.update(p.percent);
        if (p.percent >= 0.89) {
            b()
        }
    }
});
Class(function Camera() {
    Inherit(this, Component);
    var m = this;
    var b, e, f;
    var h = new THREE.Vector3();
    var q = new THREE.Vector3();
    var c = new THREE.Vector3();
    var g = new THREE.Vector3();
    var a = new THREE.Vector3();
    var n = new THREE.Vector3();
    var k = 0;
    this.mouse = q;
    (function() {
        Global.ORB_POSITION_2D = new THREE.Vector2();
        Global.MOUSE_DELTA = a;
        Mouse.capture();
        j();
        o();
        Render.startRender(l)
    })();

    function j() {
        e = new THREE.Object3D();
        b = new THREE.Object3D();
        e.add(b);
        e.position.z = Data.Timing.cameraDistance;
        f = new THREE.PerspectiveCamera(35, Stage.width / Stage.height, 10, 50000)
    }

    function l(r) {
        p();
        c.copy(q);
        c.multiplyScalar(0.25);
        c.z += Data.Timing.cameraDistance;
        var s = a.subVectors(q, n).length();
        var u = s * (Data.Timing.cameraDistance / 1000);
        k += (u - k) * (u > 1 ? 0.4 : 0.07);
        c.z += k;
        c.x = Utils.clamp(c.x, -650, 650);
        Global.MOUSE_LENGTH = s;
        if (Data.Timing.cameraDip) {
            c.z += Math.cos(r * 0.0025) * 250
        }
        n.copy(q);
        e.position.lerp(c, 0.02);
        g.y = -(Mouse.x - Stage.width / 2) * 0.0007;
        g.x = -(Mouse.y - Stage.height / 2) * 0.0002;
        g.z = Utils.toRadians(-Utils.convertRange(Mouse.x, 0, Stage.width, -7, 7));
        g.x = Utils.clamp(g.x, -0.02, 0.02);
        b.rotation.x += (g.x - b.rotation.x) * 0.02;
        b.rotation.y += (g.y - b.rotation.y) * 0.02;
        b.rotation.z += (g.z - b.rotation.z) * 0.02;
        e.updateMatrixWorld();
        b.matrixWorld.decompose(f.position, f.quaternion, f.scale);
        f.updateMatrix()
    }

    function p() {
        h.set((Mouse.x / Stage.width) * 2 - 1, -(Mouse.y / Stage.height) * 2 + 1, 0.5);
        h.unproject(f);
        var s = f.position;
        h.sub(s).normalize();
        var r = -s.z / h.z;
        q.copy(s).add(h.multiplyScalar(r))
    }

    function o() {
        m.events.subscribe(HydraEvents.RESIZE, d)
    }

    function d() {
        f.aspect = Stage.width / Stage.height;
        f.updateProjectionMatrix()
    }
    this.get("worldCamera", function() {
        return f
    })
}, "Singleton");
Class(function WaterReflection() {
    Inherit(this, Component);
    var g = this;
    var a, b, l;
    var d = new RenderPerformance();
    (function() {
        m();
        e();
        k()
    })();

    function m() {
        a = new THREE.Mirror(Renderer.instance().r, Camera.instance().worldCamera, {
            clipBias: 0.003,
            textureWidth: Stage.width,
            textureHeight: Stage.height
        })
    }

    function e() {
        var o = new THREE.PlaneGeometry(10000, 10000);
        var n = new THREE.Mesh(o, a.material);
        n.add(a);
        n.material.visible = false;
        n.rotation.x = Utils.toRadians(-90);
        g.mesh = n
    }

    function f() {
        if (l) {
            d.time()
        }
        a.render();
        if (l) {
            d.time()
        }
    }

    function k() {
        g.events.subscribe(HomeEvents.START_TERRAIN, c);
        g.events.subscribe(HomeEvents.START_STARS, h);
        g.events.subscribe(HomeEvents.TEST_REFLECTION, j)
    }

    function h() {
        Render.stopRender(f)
    }

    function c() {
        if (!Device.mobile && !b) {
            Render.startRender(f)
        }
    }

    function j() {
        l = true;
        setTimeout(function() {
            if (d.median > 1.8 || !Device.browser.chrome) {
                b = true;
                g.disable = true;
                Render.stopRender(f)
            }
            g.events.fire(HomeEvents.REFLECTION_COMPLETE, {
                disable: b
            })
        }, 500)
    }
    this.get("texture", function() {
        return a.texture
    });
    this.get("textureMatrix", function() {
        return a.textureMatrix
    })
});
Class(function WaterGeometry(o, p) {
    Inherit(this, Component);
    var n = this;
    var f, t, m;
    var b, e, s;
    var d = Camera.instance().worldCamera;
    var j = new THREE.Vector3();
    var k = new LinkedList();
    var q = Date.now();
    (function() {
        c();
        a();
        l()
    })();

    function c() {
        f = new THREE.PlaneGeometry(40000, 40000, 45, 45);
        f.applyMatrix(new THREE.Matrix4().makeRotationX(Utils.toRadians(-90)))
    }

    function a() {
        e = {
            startAngle: {
                type: "f",
                value: []
            },
            speed: {
                type: "f",
                value: []
            },
            range: {
                type: "f",
                value: []
            },
            interact: {
                type: "f",
                value: []
            },
        };
        b = {
            time: {
                type: "f",
                value: 0
            },
            reflection: {
                type: "t",
                value: p.texture
            },
            textureMatrix: {
                type: "m4",
                value: p.textureMatrix
            },
            ambient1: {
                type: "c",
                value: Data.Color.getColor("water", "color0")
            },
            ambient2: {
                type: "c",
                value: Data.Color.getColor("water", "color1")
            },
            sun: {
                type: "c",
                value: new THREE.Color(16711680)
            },
            light: {
                type: "v3",
                value: new THREE.Vector3(-3000, 3000, 0)
            },
            orbColor: {
                type: "c",
                value: Data.Color.getOrbColor()
            },
            distort: {
                type: "f",
                value: 1
            },
            disableRefl: {
                type: "f",
                value: 0
            },
            cameraZ: {
                type: "f",
                value: 0
            },
        };
        if (Device.mobile) {
            delete b.reflection;
            b.disableRefl.value = 1
        }
        var w = o.getUniforms();
        b.fogColor = w.fogColor;
        b.fogNear = w.fogNear;
        b.fogFar = w.fogFar;
        for (var x = 0; x < f.vertices.length; x++) {
            e.startAngle.value[x] = Utils.doRandom(-Math.PI * 2, Math.PI * 2);
            e.speed.value[x] = Utils.doRandom(5, 10) / 20;
            e.range.value[x] = Utils.doRandom(-250, 250);
            var u = f.vertices[x];
            u.interact = e.interact.value;
            u.index = x;
            u.amount = 0;
            u.target = 0;
            u.interact[x] = 0;
            k.push(f.vertices[x])
        }
        t = new THREE.ShaderMaterial({
            uniforms: b,
            attributes: e,
            vertexShader: Hydra.SHADERS["Water.vs"],
            fragmentShader: Hydra.SHADERS["Water.fs"]
        });
        t.shading = THREE.FlatShading;
        t.deptWrite = false;
        m = new THREE.Mesh(f, t);
        m.controller = n;
        n.mesh = m;
        m.position.y = -300;
        var y = new THREE.PlaneBufferGeometry(40000, 40000);
        y.applyMatrix(new THREE.Matrix4().makeRotationX(Utils.toRadians(-90)));
        n.hit = new THREE.Mesh(y, new THREE.MeshBasicMaterial({
            wireframe: true
        }));
        n.hit.controller = n;
        n.hit.visible = false;
        n.mesh.add(n.hit)
    }

    function r(w) {
        b.time.value = (w - q) * 0.007;
        var u = k.start();
        while (u) {
            u.amount += (u.target - u.amount) * 0.07;
            u.interact[u.index] = u.amount;
            u = k.next()
        }
        b.cameraZ.value = d.position.z;
        if (!s) {
            e.interact.needsUpdate = true
        }
    }

    function l() {
        n.events.subscribe(HomeEvents.START_TERRAIN, h);
        n.events.subscribe(HomeEvents.START_STARS, g)
    }

    function g() {
        m.visible = false;
        Render.stopRender(r)
    }

    function h() {
        m.visible = true;
        Render.startRender(r)
    }
    this.interact = function(u) {
        j.copy(u);
        m.worldToLocal(j);
        var w = k.start();
        while (w) {
            var x = j.distanceTo(w);
            if (x < Data.Timing.orbRadius) {
                w.target = Utils.convertRange(x, 0, Data.Timing.orbRadius, 1, 0)
            } else {
                w.target = 0
            }
            w = k.next()
        }
    };
    this.disableRefl = function() {
        m.material.uniforms.disableRefl.value = 1;
        delete m.material.uniforms.reflection
    };
    this.prevent = function() {
        if (Device.mobile) {
            s = true
        }
    }
});
Class(function TerrestrialWater(n) {
    Inherit(this, Component);
    var m = this;
    var f, a, s;
    var e = [];
    var l = [];
    this.object3D = new THREE.Object3D();
    var d = Camera.instance().worldCamera;
    var k = new THREE.Raycaster();
    var g = new THREE.Vector3();
    var b = new THREE.Vector3();
    (function() {
        o();
        q();
        c();
        j()
    })();

    function o() {
        m.object3D.position.y = -2500;
        m.object3D.rotation.x = Utils.toRadians(15);
        f = new THREE.Object3D();
        m.object3D.add(f)
    }

    function c() {
        for (var u = 0; u < 2; u++) {
            var t = m.initClass(WaterGeometry, n, a);
            t.mesh.position.z = -u * 37000;
            l.push(t.hit);
            e.push(t);
            f.add(t.mesh)
        }
    }

    function q() {
        a = m.initClass(WaterReflection);
        m.object3D.add(a.mesh)
    }

    function r() {
        if (!Device.mobile) {
            p()
        }
        f.position.z += Data.Timing.moveSpeed;
        for (var u = 0; u < e.length; u++) {
            var t = e[u];
            var v = f.position.z + t.mesh.position.z;
            if (v > 30000) {
                t.mesh.position.z -= 37000 * 2
            }
        }
        if (a.disable) {
            if (a.mesh.visible) {
                for (u = 0; u < 2; u++) {
                    e[u].disableRefl()
                }
                a.mesh.visible = false
            }
        }
    }

    function j() {
        m.events.subscribe(HomeEvents.ENDING_WATER, h)
    }

    function h() {
        if (Device.mobile) {
            Stage.unbind("touchmove", p)
        }
        for (i = 0; i < 2; i++) {
            e[i].prevent()
        }
    }

    function p(w) {
        b.x = (Mouse.x / Stage.width) * 2 - 1;
        b.y = -(Mouse.y / Stage.height) * 2 + 1;
        g.set(b.x, b.y, 1).unproject(d);
        k.set(d.position, g.sub(d.position).normalize());
        var t = k.intersectObjects(l);
        var u = t[0];
        if (u) {
            for (var v = 0; v < 2; v++) {
                e[v].interact(u.point)
            }
        }
    }
    this.start = function() {
        if (Device.mobile) {
            Stage.bind("touchmove", p)
        }
        Render.startRender(r)
    };
    this.stop = function() {
        if (Device.mobile) {
            Stage.unbind("touchmove", p)
        }
        Render.stopRender(r)
    }
});
Class(function TerrestrialTerrain(q) {
    Inherit(this, Component);
    var p = this;
    var e, a;
    var n = [];
    var w = [];
    var c = [];
    var m = [];
    var d = [];
    var k = Device.mobile ? 2200 : 4000;
    this.object3D = new THREE.Object3D();
    (function() {
        r();
        u();
        l()
    })();

    function r() {
        p.object3D.position.y = -3300;
        p.object3D.rotation.x = Utils.toRadians(15);
        e = new THREE.Object3D();
        p.object3D.add(e);
        e.position.z = -60000
    }

    function u() {
        var x = 0;
        var y = new DistributedWorker(8);
        y.start(function() {
            var z = p.initClass(TerrainGeometry, x, q.getUniforms());
            z.hide();
            e.add(z.mesh);
            m.push(z.mesh);
            d.push(z.hit);
            n.push(z);
            w.push(z);
            x++;
            if (x == 12) {
                y.stop();
                v()
            }
        })
    }

    function h() {
        var x = Utils.doRandom(0, w.length - 1);
        var y = w[x];
        w.splice(x, 1);
        c.push(y);
        return y
    }

    function s(y) {
        var x = c.indexOf(y);
        c.splice(x, 1);
        w.push(y)
    }

    function v() {
        var y = -9000;
        var D = 0;
        var A = 12;
        for (var C = 0; C < A; C++) {
            var B = h();
            B.position(y, D);
            B.show();
            y += 9000;
            if (y > 9000) {
                y = -9000;
                D += -9000
            }
        }
    }

    function o() {
        var y = -9000;
        for (var A = 0; A < 3; A++) {
            var z = h();
            z.position(y, z.mesh.position.z + -36000);
            z.hold = false;
            y += 9000
        }
    }

    function t() {
        if (!a) {
            return
        }
        if (!window.freeze) {
            e.position.z += Data.Timing.moveSpeed
        }
        for (var y = 0; y < c.length; y++) {
            var x = c[y];
            x.update();
            var z = e.position.z + x.mesh.position.z;
            if (z > k && !x.hold) {
                x.reset();
                x.hold = true;
                s(x)
            }
        }
        if (w.length == 3) {
            o()
        }
    }

    function l() {
        p.events.subscribe(HomeEvents.START_TERRAIN, g);
        p.events.subscribe(HomeEvents.START_STARS, f);
        p.events.subscribe(HomeEvents.REPLAY, b);
        p.events.subscribe(HomeEvents.START_EXP, j)
    }

    function j() {
        a = true
    }

    function b() {
        p.object3D.position.y = -3300;
        e.position.z = -60000
    }

    function f() {
        Render.stopRender(t);
        for (var x = 0; x < n.length; x++) {
            n[x].hide()
        }
    }

    function g() {
        TweenManager.tween(p.object3D.position, {
            y: -2500
        }, 30000, "easeInOutCubic", 20000);
        Render.startRender(t);
        for (var x = 0; x < n.length; x++) {
            n[x].show()
        }
    }
    this.get("terrains", function() {
        return Device.browser.chrome ? m : d
    });
    this.get("hits", function() {
        return d
    })
});
Class(function TerrainGeometry(l, o) {
    Inherit(this, Component);
    var h = this;
    var g, c, m, n, e, f;
    var b = Camera.instance().worldCamera;
    var k = new THREE.Vector3();
    var j = new LinkedList();
    this.index = l;
    (function() {
        p();
        a();
        d()
    })();

    function p() {
        var q = new THREE.JSONLoader();
        g = q.parse(Hydra.JSON["t" + l].data).geometry
    }

    function a() {
        e = {
            snowHeight: {
                type: "f",
                value: []
            },
            interact: {
                type: "f",
                value: []
            },
        };
        var r = 0;
        for (var s = 0; s < g.vertices.length; s++) {
            var q = g.vertices[s];
            var u = Math.abs(q.x);
            var t = Math.abs(q.z);
            e.snowHeight.value[s] = Utils.doRandom(1200, 1500);
            e.interact.value[s] = 0;
            if (q.y > 0) {
                q.canMove = true;
                if (u > 4500) {
                    q.y *= Utils.convertRange(u, 4500, 5000, 1, 0)
                }
                if (t > 4500) {
                    q.y *= Utils.convertRange(t, 4500, 5000, 1, 0)
                }
            }
            r += 0.002;
            q.oy = q.y;
            q.y = q.sy = q.y * (q.canMove ? Data.Timing.startVertex : 1);
            q.index = s;
            q.light = 0;
            q.targetLight = 0;
            j.push(q)
        }
        g.computeFaceNormals();
        g.normalsNeedUpdate = true
    }

    function d() {
        c = new THREE.ShaderMaterial({
            attributes: e,
            uniforms: o,
            vertexShader: Hydra.SHADERS["Terrain.vs"],
            fragmentShader: Hydra.SHADERS["Terrain.fs"]
        });
        c.shading = THREE.FlatShading;
        c.transparent = true;
        c.side = THREE.DoubleSide;
        m = new THREE.Mesh(g, c);
        m.controller = h;
        h.mesh = m;
        var q = new THREE.PlaneBufferGeometry(10000, 10000);
        q.applyMatrix(new THREE.Matrix4().makeRotationX(Utils.toRadians(-90)));
        h.hit = new THREE.Mesh(q, new THREE.MeshBasicMaterial({
            wireframe: true
        }));
        h.hit.controller = h;
        h.hit.visible = false;
        h.mesh.add(h.hit)
    }
    this.update = function() {
        o.cameraZ.value = b.position.z;
        o.snowMult.value = Data.Timing.snowMult;
        if (n || f) {
            var q = j.start();
            while (q) {
                if (q.triggered) {
                    q.y += ((q.oy * q.triggered) - q.y) * 0.07
                }
                q.light += (q.targetLight - q.light) * 0.1;
                if (f) {
                    e.interact.value[q.index] = q.light
                }
                q = j.next()
            }
            g.verticesNeedUpdate = true;
            if (f) {
                e.interact.needsUpdate = true
            }
        }
    };
    this.interact = function(q, s, u) {
        k.copy(q);
        m.worldToLocal(k);
        var r = j.start();
        while (r) {
            var t = k.distanceTo(r);
            if (!r.triggered && r.canMove && t < s) {
                n = true;
                r.triggered = Data.Timing.terrainHeight
            }
            if (Device.browser.chrome && !Global.KILL_LIGHT && t < 1000) {
                f = true;
                r.targetLight = Utils.clamp(Utils.convertRange(t, 0, 1000, 1, 0), 0, 1)
            } else {
                r.targetLight = 0
            }
            r = j.next()
        }
    };
    this.reset = function() {
        n = false;
        f = false;
        var q = j.start();
        while (q) {
            q.y = q.oy * (q.canMove ? Data.Timing.startVertex : 1);
            q.triggered = false;
            q.targetLight = 0;
            q.light = 0;
            q = j.next()
        }
        g.verticesNeedUpdate = true
    };
    this.clearLight = function() {
        if (!f) {
            return
        }
        f = false;
        var q = j.start();
        while (q) {
            q.targetLight = 0;
            q.light = 0;
            e.interact.value[q.index] = 0;
            q = j.next()
        }
        e.interact.needsUpdate = true
    };
    this.hide = function() {
        m.visible = false
    };
    this.show = function() {
        m.visible = true
    };
    this.position = function(q, r) {
        m.position.set(q, 0, r)
    }
});
Class(function TerrestrialSky() {
    Inherit(this, Component);
    var e = this;
    (function() {
        a()
    })();

    function a() {
        var h = new THREE.IcosahedronGeometry(30000, 2);
        var f = {
            radius: {
                type: "f",
                value: 30000
            },
            color0: {
                type: "c",
                value: Data.Color.getColor("sky", "color0")
            },
            color1: {
                type: "c",
                value: Data.Color.getColor("sky", "color1")
            },
            opacity: {
                type: "f",
                value: 1
            },
        };
        var g = new THREE.ShaderMaterial({
            uniforms: f,
            vertexShader: Hydra.SHADERS["TerrainSky.vs"],
            fragmentShader: Hydra.SHADERS["TerrainSky.fs"]
        });
        g.side = THREE.BackSide;
        g.visible = true;
        e.mesh = new THREE.Mesh(h, g)
    }

    function b() {
        e.events.subscribe(HomeEvents.START_TERRAIN, c);
        e.events.subscribe(HomeEvents.START_STARS, d)
    }

    function d() {
        e.mesh.material.visible = false
    }

    function c() {
        e.mesh.material.visible = true
    }
});
Class(function TerrestrialMeteors() {
    Inherit(this, Component);
    var h = this;
    var j, o;
    var b = [];
    var a = Camera.instance().worldCamera;
    this.object3D = new THREE.Object3D();
    (function() {
        d();
        e();
        k()
    })();

    function n() {
        var p = h.object3D.position.z;
        o.position.set(Utils.doRandom(10000, 25500) * 1.5, 28000, -p - (Utils.doRandom(7000, 35000) * 2));
        o.emit();
        o.timer = setTimeout(n, 250)
    }

    function d() {
        j = h.initClass(Spark.System);
        o = h.initClass(Spark.Emitter, new Vector3(0, 0, 0), 0);
        j.addEmitter(o);
        o.addInitializer(l);
        j.addBehavior(f)
    }

    function l(q) {
        q.velocity.clear();
        if (!q.speed) {
            q.speed = new Vector3()
        }
        q.speed.set(-0.3, -0.3, 0)
    }

    function f(q) {
        q.applyForce(q.speed);
        if (q.position.y < 0) {
            q.y = q.saveTo.y = 9999;
            j.removeParticle(q);
            if (q.position.z + h.object3D.position.z < a.position.z) {
                Data.Timing.meteorHit()
            }
        }
    }

    function e() {
        var r = Device.mobile || !Device.browser.chrome ? 10 : 25;
        for (var s = 0; s < r; s++) {
            var q = h.initClass(TerrestrialMeteor);
            var t = new Spark.Particle(0, 9999, 0);
            t.saveTo = q.mesh.position;
            t.saveTo.y = 9999;
            o.addToPool(t);
            b.push(q);
            h.object3D.add(q.mesh)
        }
    }

    function g() {
        h.object3D.position.z += Data.Timing.moveSpeed;
        j.update();
        for (var q = 0; q < b.length; q++) {
            var p = b[q];
            p.update()
        }
    }

    function k() {
        h.events.subscribe(HomeEvents.METEORS_START, c);
        h.events.subscribe(HomeEvents.METEORS_STOP, m)
    }

    function c() {
        Render.startRender(g);
        n();
        for (var q = 0; q < b.length; q++) {
            var p = b[q];
            p.mesh.visible = true
        }
    }

    function m() {
        clearTimeout(o.timer);
        h.delayedCall(function() {
            Render.stopRender(g);
            for (var q = 0; q < b.length; q++) {
                var p = b[q];
                p.mesh.visible = false;
                p.mesh.position.set(0, -99999999, 0)
            }
        }, 10000)
    }
});
Class(function TerrestrialMeteor() {
    Inherit(this, Component);
    var c = this;
    var d, j, g;
    var b;
    (function() {
        a();
        h()
    })();

    function a() {
        d = new Spark.System();
        j = new Spark.Emitter(new Vector3(0, 0, 0), 0);
        j.addInitializer(f);
        d.addEmitter(j);
        d.addBehavior(e)
    }

    function f(m) {
        var l = Utils.doRandom(-5, 5) / 300;
        var k = Utils.doRandom(-5, 5) / 300;
        if (!m.speed) {
            m.speed = new Vector3(0.2 + l, 0.2 + k, 0)
        }
        m.alpha = 1;
        m.decay = 0.000007;
        m.velocity.clear()
    }

    function e(k) {
        k.applyForce(k.speed);
        k.decay *= 1.13;
        k.alpha -= k.decay;
        k.alphaValue[k.alphaIndex] = k.alpha;
        if (k.alpha <= 0) {
            k.alpha = 0;
            d.removeParticle(k);
            k.position.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
        }
    }

    function h() {
        var q = Number.POSITIVE_INFINITY;
        g = new THREE.Geometry();
        var m = {
            alpha: {
                type: "f",
                value: []
            },
            opacity: {
                type: "f",
                value: []
            }
        };
        for (var o = 0; o < 250; o++) {
            var l = new THREE.Vector3(q, q, q);
            var s = new Spark.Particle(q, q, q);
            s.saveTo = l;
            s.alphaValue = m.alpha.value;
            s.alphaIndex = o;
            s.alphaValue[o] = 1;
            m.opacity.value[o] = Utils.doRandom(3, 10) / 10;
            j.addToPool(s);
            g.vertices.push(l)
        }
        var k = {
            map: {
                type: "t",
                value: Data.Textures.getTexture("assets/images/common/particle.png")
            },
            size: {
                type: "f",
                value: (75 * 2.5) / (Mobile.os == "Android" ? 2 : 1)
            },
            globalAlpha: {
                type: "f",
                value: 1
            }
        };
        var n = new THREE.ShaderMaterial({
            attributes: m,
            uniforms: k,
            vertexShader: Hydra.SHADERS["Meteor.vs"],
            fragmentShader: Hydra.SHADERS["Meteor.fs"]
        });
        n.transparent = true;
        n.depthTest = false;
        n.blending = THREE.AdditiveBlending;
        var r = new THREE.PointCloud(g, n);
        c.mesh = r;
        r.scale.set(2.5, 2.5, 2.5);
        r.rotation.z = Utils.toRadians(Utils.doRandom(-3, 3));
        b = m
    }
    this.update = function() {
        c.mesh.visible = true;
        d.update();
        c.mesh.material.uniforms.globalAlpha.value = Utils.clamp(Utils.convertRange(c.mesh.position.y, 2000, 0, 1, 0), 0, 1);
        for (var k = 0; k < 2; k++) {
            var l = Utils.toRadians(Utils.doRandom(0, 360));
            j.position.x = Math.sin(l) * 15;
            j.position.z = Math.cos(l) * 15;
            j.emit()
        }
        b.alpha.needsUpdate = true;
        g.verticesNeedUpdate = true
    }
});
Class(function TerrestrialLight() {
    Inherit(this, Component);
    var f = this;
    var d, c, b;
    (function() {
        Global.ORB_RAY = new THREE.Vector3(-999999, 0, 0);
        a();
        e()
    })();

    function a() {
        c = Data.Color.getColor("terrain", "color0");
        b = Data.Color.getColor("terrain", "color1")
    }

    function e() {
        d = new THREE.Vector3(-8000, 20000, 1000)
    }
    this.getUniforms = function() {
        return {
            ambient1: {
                type: "c",
                value: c
            },
            ambient2: {
                type: "c",
                value: b
            },
            light: {
                type: "v3",
                value: d
            },
            fogNear: {
                type: "f",
                value: Device.mobile ? 12000 : 16000
            },
            fogFar: {
                type: "f",
                value: 25000
            },
            fogColor: {
                type: "c",
                value: Data.Color.getColor("fog", "color0")
            },
            orbColor: {
                type: "c",
                value: Data.Color.getOrbColor()
            },
            orbPosition: {
                type: "v3",
                value: Global.ORB_RAY
            },
            snowMult: {
                type: "f",
                value: 1
            },
            cameraZ: {
                type: "f",
                value: 1
            },
        }
    }
});
Class(function TerrestrialInteraction(n) {
    Inherit(this, Component);
    var f = this;
    var d, a, b, l, m;
    var p = new THREE.Raycaster();
    var h = new THREE.Vector3();
    var k = new THREE.Vector3();
    var c = new RenderPerformance();
    (function() {})();

    function o() {
        var r = new THREE.MeshNormalMaterial();
        var q = new THREE.IcosahedronGeometry(400, 2);
        b = new THREE.Mesh(q, r);
        Global.SCENE.add(b)
    }

    function e(q) {
        l = 3000 + Math.sin(q * 0.0025) * 500;
        if (!Device.mobile) {
            j()
        }
    }

    function j(v) {
        k.x = (Mouse.x / Stage.width) * 2 - 1;
        k.y = -(Mouse.y / Stage.height) * 2 + 1;
        h.set(k.x, k.y, 1).unproject(a);
        p.set(a.position, h.sub(a.position).normalize());
        if (m) {
            c.time()
        }
        var q = p.intersectObjects(d);
        var u = q[0];
        if (m) {
            c.time()
        }
        for (var s = d.length - 1; s > -1; s--) {
            var r = d[s];
            if (!u || r.controller != u.object.controller) {
                r.controller.clearLight()
            }
        }
        if (u) {
            if (Device.mobile && u.distance > 16500) {
                return
            }
            Global.ORB_RAY.copy(u.point);
            u.object.controller.interact(u.point, l, u.distance)
        }
    }

    function g() {
        m = true;
        setTimeout(function() {
            m = false;
            if (c.median > 1.5) {
                Global.KILL_LIGHT = true;
                d = f.terrain.hits
            }
        })
    }
    this.set("terrains", function(q) {
        d = q
    });
    this.set("camera", function(q) {
        a = q
    });
    this.start = function() {
        if (Device.mobile) {
            Stage.bind("touchmove", j)
        }
        Render.startRender(e);
        f.events.subscribe(HomeEvents.STARS_READY, g)
    };
    this.stop = function() {
        if (Device.mobile) {
            Stage.unbind("touchmove", j)
        }
        Render.stopRender(e)
    }
});
Class(function SpacePainterParticle(k) {
    var c = this;
    var d = new THREE.Vector3();
    var a = new THREE.Vector3();
    var b = new THREE.Vector3();
    var e = new THREE.Vector3();
    var j = new THREE.Vector3();
    var f = new THREE.Vector3();
    var h = 0;
    var g = Utils.doRandom(10000, 25000);
    (function() {})();
    this.init = function(l, m) {
        k.copy(l);
        d.copy(l);
        a.copy(m).multiplyScalar(0.25);
        a.x = Utils.clamp(a.x, -10, 10);
        a.y = Utils.clamp(a.y, -10, 10);
        e.add(new Vector3(0, 0, 10));
        if (!Utils.doRandom(0, 5)) {
            f.z = 1
        }
        b.set(Utils.doRandom(-10, 10) / 5, Utils.doRandom(-10, 10) / 5, Utils.doRandom(-10, 10) / 5);
        a.add(b)
    };
    this.update = function(m, p) {
        if (d.z < -g) {
            return
        }
        d.add(a);
        d.add(f);
        d.add(e);
        k.copy(d);
        f.z *= 1.0095;
        if (a.z > -10) {
            a.z -= 0.009
        }
        e.multiplyScalar(0.9);
        b.subVectors(m, d);
        var n = b.lengthSq();
        var o = n / 40000;
        o = o < 0 ? 0.1 : o > 1 ? 1 : o;
        var l = Math.atan2(b.y, b.x);
        if (Global.END_PARTICLES) {
            h += (0.1 - h) * 0.04
        } else {
            if (p > 2) {
                h += (0.7 - h) * 0.04
            } else {
                h += (0 - h) * 0.1
            }
        }
        j.set(0, 0, 0);
        j.x += Math.cos(l) * h;
        j.y += Math.sin(l) * h;
        e.add(j);
        if (Data.Timing.centerStars > 0) {
            d.x += (0 - d.x) * (0.009 * Data.Timing.centerStars);
            d.y += (0 - d.y) * (0.009 * Data.Timing.centerStars)
        }
    };
    this.clear = function() {
        k.set(Number.POSITIVE_INFINITY, 0, 0);
        d.set(0, 0, 0);
        a.set(0, 0, 0);
        b.set(0, 0, 0);
        e.set(0, 0, 0);
        j.set(0, 0, 0);
        f.set(0, 0, 0);
        h = 0
    }
});
Class(function SpacePainter(x) {
    Inherit(this, Component);
    var t = this;
    var d, g, p, u;
    x = x || Device.mobile;
    var m = 0;
    var f = new LinkedList();
    var a = new THREE.Vector3();
    var o = new THREE.Vector3();
    var j = new THREE.Vector3();
    var w = new THREE.Vector3();
    var b = Camera.instance().mouse;
    var n = new DynamicObject({
        v: 0
    });
    var s = x ? 6000 : 20000;
    var l = x ? 5 : 15;
    if (x && !Device.mobile) {
        s = 15000
    }
    if (Mobile.os == "Android") {
        s = 3000
    }(function() {
        r();
        q()
    })();

    function r() {
        var B = {
            scale: {
                type: "f",
                value: []
            },
            alpha: {
                type: "f",
                value: []
            },
        };
        d = new ObjectPool();
        var E = new THREE.Geometry();
        for (var D = 0; D < s; D++) {
            var A = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
            var G = new SpacePainterParticle(A);
            E.vertices.push(A);
            B.scale.value[D] = Utils.doRandom(3, 10) / 10;
            B.alpha.value[D] = Utils.doRandom(3, 10) / 10;
            d.put(G)
        }
        var z = {
            palette: {
                type: "t",
                value: THREE.ImageUtils.loadTexture("assets/images/space/palette.jpg")
            },
            map: {
                type: "t",
                value: THREE.ImageUtils.loadTexture("assets/images/space/star.png")
            },
            size: {
                type: "f",
                value: 175 / 2
            },
            opacity: {
                type: "f",
                value: 0.75
            },
            area: {
                type: "f",
                value: 3000
            }
        };
        var C = new THREE.ShaderMaterial({
            attributes: B,
            uniforms: z,
            vertexShader: Hydra.SHADERS["SpacePainter.vs"],
            fragmentShader: Hydra.SHADERS["SpacePainter.fs"]
        });
        C.transparent = true;
        C.depthTest = C.depthWrite = false;
        C.blending = THREE.AdditiveBlending;
        var F = new THREE.PointCloud(E, C);
        t.mesh = F;
        g = E;
        p = F;
        p.visible = false;
        p.position.z = 1
    }

    function h() {
        if (u) {
            return
        }
        Data.Timing.runOutOfStars();
        u = true;
        Global.END_PARTICLES = true;
        n.tween({
            v: 10
        }, 10000, "easeInCubic")
    }

    function k() {
        if (f.length >= s) {
            return h()
        }
        var z = d.get();
        z.init(b, o);
        f.push(z)
    }

    function y() {
        var B = j.subVectors(b, w).length();
        var A = f.start();
        while (A) {
            A.update(b, B);
            A = f.next()
        }
        w.copy(b);
        g.verticesNeedUpdate = true;
        if (u) {
            if (m < 0.002) {
                m += 0.0004
            }
            p.rotation.z += m;
            p.position.z += n.v
        }
        for (var z = 0; z < l; z++) {
            k()
        }
    }

    function q() {
        t.events.subscribe(HomeEvents.START_PAINTER, e);
        t.events.subscribe(HomeEvents.REPLAY, c)
    }

    function c() {
        Render.stopRender(y);
        Stage.unbind("touchmove", v);
        p.visible = false;
        u = false;
        p.rotation.z = 0;
        p.position.z = 1;
        var z = Number.POSITIVE_INFINITY;
        var A = f.start();
        while (A) {
            A.clear();
            d.put(A);
            A = f.next()
        }
        f.empty()
    }

    function e() {
        Stage.bind("touchmove", v);
        Render.startRender(y);
        p.visible = true
    }

    function v(z) {
        o.subVectors(b, a);
        a.copy(b)
    }
});
Class(function SpaceDistance() {
    Inherit(this, Component);
    var g = this;
    var k, l, e;
    this.object3D = new THREE.Object3D();
    (function() {
        a();
        c();
        h()
    })();

    function a() {
        var n = new Vector3();
        var q = new Matrix4();
        var p = {
            scale: {
                type: "f",
                value: []
            },
            alpha: {
                type: "f",
                value: []
            },
            mixValue: {
                type: "f",
                value: []
            },
        };
        var t = new THREE.Geometry();
        for (var s = 0; s < 3000; s++) {
            var o = new THREE.Vector3();
            n.set(1, 0, 0);
            q.identity().setRotation(0, Utils.toRadians(Utils.doRandom(-180, 180)), Utils.toRadians(Utils.doRandom(-180, 180)));
            q.transformVector(n);
            n.multiply(5000);
            n.copyTo(o);
            t.vertices.push(o);
            p.scale.value[s] = Utils.doRandom(5, 10) / 10;
            p.alpha.value[s] = Utils.doRandom(2, 10) / 10;
            p.mixValue.value[s] = Utils.doRandom(0, 10) / 15
        }
        var m = {
            size: {
                type: "f",
                value: 6
            },
            map: {
                type: "t",
                value: Data.Textures.getTexture("assets/images/space/star.png")
            },
            opacity: {
                type: "f",
                value: 0
            },
            color: {
                type: "c",
                value: new THREE.Color(16775361)
            },
        };
        var r = new THREE.ShaderMaterial({
            uniforms: m,
            attributes: p,
            vertexShader: Hydra.SHADERS["SpaceDistance.vs"],
            fragmentShader: Hydra.SHADERS["SpaceDistance.fs"]
        });
        r.transparent = true;
        r.depthTest = r.depthWrite = false;
        l = new THREE.PointCloud(t, r);
        l.rotation.x = Utils.toRadians(90);
        l.visible = false;
        g.object3D.add(l)
    }

    function c() {
        var u = new THREE.IcosahedronGeometry(5000, 0);
        var r = new THREE.MeshLambertMaterial({
            color: 921102
        });
        r.side = THREE.BackSide;
        r.transparent = true;
        r.opacity = 0;
        e = new THREE.Mesh(u, r);
        e.visible = false;
        g.object3D.add(e);
        k = new THREE.Object3D();
        g.object3D.add(k);
        var m = 5000;
        var n = 9.5;
        var s = 1000;
        var o = [{
            position: new THREE.Vector3(-s, s, 0),
            color: 16730802
        }, {
            position: new THREE.Vector3(s, s, 0),
            color: 5914367
        }, {
            position: new THREE.Vector3(s, -s, 0),
            color: 16720710
        }, {
            position: new THREE.Vector3(-s, -s, 0),
            color: 9065983
        }];
        for (var q = 0; q < 4; q++) {
            var t = o[q];
            var p = new THREE.PointLight(t.color, n, m);
            p.position.copy(t.position);
            k.add(p)
        }
        k.rotator = new Random3DRotation(k)
    }

    function f(m) {
        l.rotation.z += 0.0002;
        k.rotator.update(m);
        if (e.material.transparent) {
            l.material.uniforms.opacity.value = Data.Timing.skyTransition
        }
        e.material.opacity = Data.Timing.skyTransition
    }

    function h() {
        g.events.subscribe(HomeEvents.ENTER_SPACE, b);
        g.events.subscribe(HomeEvents.START_STARS, j);
        g.events.subscribe(HomeEvents.REPLAY, d)
    }

    function d() {
        l.material.uniforms.opacity.value = 1;
        l.visible = false;
        e.visible = false;
        Render.stopRender(f)
    }

    function j() {
        e.material.transparent = false;
        TweenManager.tween(l.material.uniforms.opacity, {
            value: 0
        }, 10000, "easeInOutSine", 5000)
    }

    function b() {
        l.visible = true;
        e.visible = true;
        Render.startRender(f)
    }
});
Class(function FXComposer() {
    Inherit(this, Component);
    var k = this;
    var d, p, c;
    var n = Renderer.instance().r;
    var m = MainScene.instance().scene;
    var b = Camera.instance().worldCamera;
    var g = new RenderPerformance();
    (function() {
        if (!Device.mobile) {
            f();
            j()
        }
        l();
        k.delayedCall(a, 750);
        Render.startRender(h)
    })();

    function f() {
        d = new THREE.EffectComposer(n)
    }

    function j() {
        var q = new THREE.RenderPass(m, b);
        d.addPass(q);
        p = new THREE.BokehPass(MainScene.instance().scene, Camera.instance().worldCamera, {
            width: Stage.width / 2,
            height: Stage.height / 2,
            aperture: 0,
        });
        p.uniforms.fogColor.value = Data.Color.getColor("fog", "color0");
        p.uniforms.tNoise.value = Data.Textures.getTexture("assets/images/common/noise.jpg");
        p.renderToScreen = true;
        d.addPass(p)
    }

    function h() {
        if (d) {
            p.uniforms.fogAmount.value = Utils.convertRange(Data.Timing.aperture, 0, 0.04, 0, 1);
            p.uniforms.aperture.value = Data.Timing.aperture;
            g.time();
            d.render();
            g.time()
        } else {
            if (c) {
                g.time()
            }
            n.render(m, b);
            if (c) {
                g.time()
            }
        }
    }

    function a() {
        if (g.median > 2.5) {
            d = null
        }
        k.events.fire(HomeEvents.TEST_REFLECTION)
    }

    function l() {
        k.events.subscribe(HomeEvents.TEST_RETINA, o);
        k.events.subscribe(HydraEvents.RESIZE, e)
    }

    function o() {
        c = true;
        setTimeout(function() {
            if (g.median > 8) {
                Global.KILL_RETINA = true;
                k.events.fire(HydraEvents.RESIZE)
            }
        }, 500)
    }

    function e() {
        if (d) {
            f();
            j()
        }
    }
}, "Singleton");
Class(function OrbTrail(j) {
    Inherit(this, Component);
    var g = this;
    var h, q, n, d;
    var b;
    var k = new Vector3();
    var e = new Vector3();
    this.object3D = new THREE.Object3D();
    (function() {
        a();
        p();
        l()
    })();

    function a() {
        h = new Spark.System();
        q = new Spark.Emitter(new Vector3(0, 0, 0), 0);
        q.addInitializer(c);
        h.addEmitter(q);
        h.addBehavior(o)
    }

    function p() {
        n = new THREE.Geometry();
        var w = Number.POSITIVE_INFINITY;
        d = {
            alpha: {
                type: "f",
                value: []
            },
        };
        for (var u = 0; u < 150; u++) {
            var s = new THREE.Vector3(w, w, w);
            n.vertices.push(s);
            d.alpha.value[u] = 1;
            var y = new Spark.Particle(w, w, w);
            y.saveTo = s;
            y.index = u;
            q.addToPool(y)
        }
        var r = {
            map: {
                type: "t",
                value: Data.Textures.getTexture("assets/images/orb/particle.png")
            },
            size: {
                type: "f",
                value: Device.mobile ? 3 : 4
            },
            color: {
                type: "c",
                value: Data.Color.getOrbColor()
            },
            hsl: {
                type: "v3",
                value: Data.Color.getOrbHSL()
            },
            opacity: {
                type: "f",
                value: 0.45
            }
        };
        var t = new THREE.ShaderMaterial({
            uniforms: r,
            attributes: d,
            vertexShader: Hydra.SHADERS["Trail.vs"],
            fragmentShader: Hydra.SHADERS["Trail.fs"]
        });
        t.transparent = true;
        t.depthTest = false;
        t.blending = THREE.AdditiveBlending;
        var x = new THREE.PointCloud(n, t);
        g.object3D.add(x)
    }

    function c(r) {
        r.alpha = 1;
        r.decay = Utils.doRandom(1, 5) / 75;
        r.zSpeed = Data.Timing.moveSpeed / 100;
        r.velocity.clear();
        if (!r.scatter) {
            r.scatter = new Vector3()
        }
        r.scatter.set(Utils.doRandom(-30, 30) / 10, Utils.doRandom(-30, 30) / 10, 0);
        r.acceleration.add(r.scatter);
        r.acceleration.add(e.multiply(0.2))
    }

    function o(r) {
        r.alpha -= r.decay;
        r.velocity.z += r.zSpeed;
        d.alpha.value[r.index] = r.alpha;
        if (r.alpha <= 0) {
            r.position.y = -9999999;
            r.system.removeParticle(r)
        }
    }

    function l() {
        g.events.subscribe(HomeEvents.SCALE_ORB, f);
        g.events.subscribe(HomeEvents.REPLAY, m)
    }

    function f() {
        b = true
    }

    function m() {
        b = false
    }
    this.update = function(r) {
        e.subVectors(j, k);
        k.copyFrom(j);
        if (!b && (Mouse.y / Stage.height > 0.4) && e.length() > 10) {
            q.position.copyFrom(j);
            q.emit()
        }
        h.update();
        n.verticesNeedUpdate = true;
        d.alpha.needsUpdate = true
    }
});
Class(function OrbPulser(j) {
    Inherit(this, Component);
    var h = this;
    var g, a, b, c;
    var l = new THREE.Vector3(0.35, 0.35, 0.35);
    var e = Date.now();
    this.object3D = new THREE.Object3D();
    (function() {
        n();
        m();
        o();
        k()
    })();

    function n() {
        var p = {
            radius: {
                type: "f",
                value: 120
            }
        };
        var r = new THREE.ShaderMaterial({
            uniforms: p,
            vertexShader: Hydra.SHADERS["OrbCenter.vs"],
            fragmentShader: Hydra.SHADERS["OrbCenter.fs"]
        });
        r.shading = THREE.FlatShading;
        r.wireframe = true;
        r.blending = THREE.AdditiveBlending;
        var q = new THREE.IcosahedronGeometry(110, 0);
        g = new THREE.Mesh(q, r);
        g.rotator = new Random3DRotation(g);
        h.object3D.add(g)
    }

    function m() {
        var r = new THREE.IcosahedronGeometry(140, 3);
        var p = {
            radius: {
                type: "f",
                value: 150
            },
            color: {
                type: "c",
                value: Data.Color.getOrbColor()
            },
            time: {
                type: "f",
                value: 1
            },
            low: {
                type: "f",
                value: 0
            },
            mid: {
                type: "f",
                value: 0
            },
            high: {
                type: "f",
                value: 20
            },
            range: {
                type: "f",
                value: 25
            },
        };
        var q = new THREE.ShaderMaterial({
            uniforms: p,
            vertexShader: Hydra.SHADERS["OrbBulb.vs"],
            fragmentShader: Hydra.SHADERS["OrbBulb.fs"]
        });
        q.transparent = true;
        q.blending = THREE.AdditiveBlending;
        a = new THREE.Mesh(r, q);
        a.rotator = new Random3DRotation(a);
        h.object3D.add(a)
    }

    function o() {
        var p = {
            map: {
                type: "t",
                value: Data.Textures.getTexture("assets/images/orb/flare.png")
            },
            color: {
                type: "c",
                value: Data.Color.getOrbColor()
            },
            opacity: {
                type: "f",
                value: 0.75
            },
        };
        var r = new THREE.ShaderMaterial({
            uniforms: p,
            vertexShader: Hydra.SHADERS["OrbFlare.vs"],
            fragmentShader: Hydra.SHADERS["OrbFlare.fs"]
        });
        r.transparent = true;
        r.blending = THREE.AdditiveBlending;
        r.depthTest = false;
        var q = new THREE.PlaneBufferGeometry(500, 500);
        b = new THREE.Mesh(q, r);
        h.object3D.add(b)
    }

    function k() {
        h.events.subscribe(HomeEvents.SCALE_ORB, d);
        h.events.subscribe(HomeEvents.REPLAY, f)
    }

    function d() {
        c = true;
        TweenManager.tween(h.object3D.scale, {
            x: 0.00001,
            y: 0.00001,
            z: 0.00001
        }, 10000, "easeInOutCubic", 15000)
    }

    function f() {
        c = false;
        h.object3D.scale.set(1, 1, 1)
    }
    this.update = function(q) {
        g.rotator.update(q);
        var r = Utils.clamp(Utils.convertRange(Global.MOUSE_LENGTH, 0, 30, 1, 0.5), 0.5, 1);
        var p = Utils.clamp(Utils.convertRange(Global.MOUSE_DELTA.x, 0, 30, 0, 0.3), 0, 0.3);
        var s = Utils.clamp(Utils.convertRange(Global.MOUSE_DELTA.y, 0, 30, 0, 0.3), 0, 0.3);
        l.x = r + p;
        l.y = r + s;
        l.z = r;
        l.multiplyScalar(Utils.convertRange(Mouse.y, 0, Stage.height, 0, 0.4));
        if (!c) {
            h.object3D.scale.lerp(l, 0.3)
        }
        b.quaternion.copy(Camera.instance().worldCamera.quaternion);
        h.object3D.position.copy(j)
    }
});
Class(function LandingView() {
    Inherit(this, View);
    var j = this;
    var n, b, o, r, f;
    var a = [],
        e;
    (function() {
        g();
        m();
        d();
        p();
        k();
        c();
        j.delayedCall(l, 200)
    })();

    function g() {
        n = j.element;
        n.size("100%");
        n.div.style.background = Device.vendor + "linear-gradient(top, #7d73be 0%,#637eac 100%)";
        r = n.create("container");
        r.size("100%").transformPoint("50%", "50%").invisible()
    }

    function m() {
        b = r.create(".logo");
        var s = 0.37;
        b.size(1226 * s, 328 * s).center().bg(Config.CDN + "assets/images/landing/logo.png").css({
            marginTop: -170,
            opacity: 0.85
        })
    }

    function d() {
        o = r.create(".text");
        o.fontStyle("PT Sans", 10, "#fff");
        o.css({
            width: "100%",
            textAlign: "center",
            top: "50%",
            letterSpacing: 2.5,
            marginTop: -35,
            lineHeight: 16,
            opacity: 0.8
        });
        o.html("AN AUDIO VISUAL JOURNEY.<br/>" + (Device.mobile ? "TOUCH TO INTERACT." : "MOVE YOUR MOUSE TO INTERACT."));
        f = r.create(".text");
        f.fontStyle("PT Sans", 10, "#fff");
        f.css({
            width: "100%",
            textDecoration: "underline",
            textAlign: "center",
            top: "50%",
            marginTop: 0,
            letterSpacing: 2.5,
            lineHeight: 16,
            opacity: 0.8
        });
        f.html("MUSIC: AWAKE BY TYCHO");
        f.interact(h, q)
    }

    function p() {
        e = j.initClass(LandingSpinner, null);
        j.events.bubble(e, HydraEvents.CLICK);
        r.add(e);
        if (!Device.graphics.webgl) {
            o.html("SORRY, WEBGL IS REQUIRED FOR THIS EXPERIENCE");
            e.element.hide()
        }
    }

    function l() {
        r.visible();
        b.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            y: 0,
            opacity: 1
        }, 700, "easeOutCubic");
        o.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            y: 0,
            opacity: 1
        }, 700, "easeOutCubic", 200);
        f.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            y: 0,
            opacity: 1
        }, 700, "easeOutCubic", 500);
        e.element.transform({
            y: 10
        }).css({
            opacity: 0
        }).tween({
            y: 0,
            opacity: 1
        }, 700, "easeOutCubic", 400)
    }

    function k() {
        j.events.subscribe(HydraEvents.RESIZE, c)
    }

    function c() {
        var s;
        if (Stage.height > Stage.width && Stage.width < 500) {
            s = Stage.width / 500
        }
        if (Stage.width > Stage.height && Stage.height < 600) {
            s = Stage.height / 600
        }
        if (s) {
            r.transform({
                scale: s
            })
        } else {
            r.clearTransform()
        }
    }

    function h(s) {
        switch (s.action) {
            case "over":
                f.tween({
                    opacity: 1
                }, 100, "easeOutSine");
                break;
            case "out":
                f.tween({
                    opacity: 0.8
                }, 100, "easeOutSine");
                break
        }
    }

    function q() {
        getURL("https://soundcloud.com/tycho/tycho-awake", "_blank")
    }
    this.animateOut = function() {
        n.mouseEnabled(false);
        b.tween({
            opacity: 0
        }, 500, "easeOutCubic", 100);
        o.tween({
            opacity: 0
        }, 500, "easeOutCubic", 225);
        f.tween({
            opacity: 0
        }, 500, "easeOutCubic", 300);
        n.tween({
            opacity: 0
        }, 3000, "easeInOutSine", 400)
    };
    this.update = function(s) {
        e.update(s)
    }
});
Class(function LandingSpinner() {
    Inherit(this, View);
    var k = this;
    var n, d, l, c, q, p;
    var a;
    var o = 130;
    (function() {
        h();
        e();
        f();
        g()
    })();

    function h() {
        n = k.element;
        n.size(o, o).center().css({
            marginTop: 40
        }).enable3D(200)
    }

    function g() {
        d = n.create(".bg");
        d.size(o, o).center().bg(Config.CDN + "assets/images/landing/loader/bg.png").css({
            opacity: 0.1
        });
        c = n.create(".bg");
        c.size(o, o).center().bg(Config.CDN + "assets/images/landing/loader/ring.png").css({
            opacity: 0
        });
        l = n.create(".bg");
        l.size(o, o).center().bg(Config.CDN + "assets/images/landing/loader/solid.png").css({
            opacity: 0
        })
    }

    function f() {
        q = n.create(".spin");
        q.size(o, o).center().bg(Config.CDN + "assets/images/landing/loader/top.png");
        a = k.initClass(CSSAnimation);
        a.loop = true;
        a.ease = "linear";
        a.duration = 1000;
        a.frames = [{
            rotation: 0
        }, {
            rotation: 360
        }];
        a.applyTo(q);
        a.play()
    }

    function e() {
        p = n.create(".text");
        p.fontStyle("PT Sans", 12, "#fff");
        p.css({
            width: "100%",
            textAlign: "center",
            top: "50%",
            letterSpacing: 2.5,
            marginTop: -10,
            lineHeight: 20,
            opacity: 0.8
        });
        p.html("0").setZ(20)
    }

    function m() {
        n.interact(j, r);
        n.hit.transform({
            z: 1
        })
    }

    function j(s) {
        if (k.clicked) {
            return
        }
        switch (s.action) {
            case "over":
                c.stopTween().transform({
                    scale: 1
                }).css({
                    opacity: 0.4
                }).tween({
                    scale: 1.4,
                    opacity: 0
                }, 1000, "easeOutSine", 50);
                l.transform({
                    scale: 0.4
                }).tween({
                    scale: 1,
                    opacity: 1
                }, 600, "easeOutCirc");
                p.tween({
                    color: "#6D7AB3",
                    z: 1
                }, 400, "easeOutCubic");
                d.tween({
                    opacity: 1
                }, 200, "easeOutCubic");
                break;
            case "out":
                l.tween({
                    opacity: 0
                }, 300, "easeOutSine");
                d.tween({
                    opacity: 0.4
                }, 400, "easeOutSine");
                p.tween({
                    color: "#fff",
                    z: 1
                }, 300, "easeOutSine");
                break
        }
    }

    function r() {
        if (k.clicked) {
            return
        }
        k.clicked = true;
        n.tween({
            scale: 0.9,
            opacity: 0
        }, 300, "easeOutCubic");
        k.events.fire(HydraEvents.CLICK)
    }

    function b() {
        m();
        p.div.innerHTML = "BEGIN";
        d.tween({
            opacity: 0.4
        }, 400, "easeOutSine");
        q.tween({
            opacity: 0
        }, 400, "easeOutSine", function() {
            a.stop()
        })
    }
    this.update = function(s) {
        p.div.innerHTML = Math.round(s * 100);
        if (s == 1) {
            b()
        }
    }
});
Class(function EndView() {
    Inherit(this, View);
    var f = this;
    var e, b;
    (function() {
        d();
        c();
        a()
    })();

    function d() {
        e = f.element;
        e.size("100%").bg("#FFF").setZ(999999).css({
            opacity: 0
        }).hide();
        Stage.add(e);
        b = e.create("img");
        b.size(512, 180).bg(Config.CDN + "assets/images/common/end.png").center().css({
            opacity: 0
        })
    }

    function c() {
        f.events.subscribe(HydraEvents.RESIZE, a)
    }

    function a() {
        if (Stage.width < 600) {
            b.transform({
                scale: Stage.width / 600
            })
        } else {
            b.clearTransform()
        }
    }
    this.animateIn = function() {
        e.show();
        e.tween({
            opacity: 1
        }, 5000, "easeInOutSine", function() {
            __body.css({
                cursor: "auto"
            })
        });
        b.tween({
            opacity: 1
        }, 5000, "easeInOutSine", 2500);
        GATracker.trackPage("end")
    }
}, "Singleton");
Class(function Main() {
    var b;
    (function() {
        __body.bg("#fff");
        __body.div.style.background = Device.vendor + "linear-gradient(top, #7d73be 0%,#637eac 100%)";
        Mouse.capture();
        EndView.instance();
        b = new Loader();
        b.events.add(HydraEvents.COMPLETE, a)
    })();

    function a() {
        b.destroy()
    }
});