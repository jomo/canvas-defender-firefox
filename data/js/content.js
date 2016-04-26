function main(r, g, b, a) {
    //console.log("r" + r + "g" + g + "b" + b + "a" + a);
    function override(rootElem, functName) {
        //console.log("overriding " + functName);
        var old = rootElem[functName];
        rootElem[functName] = function (arg1, arg2) {
            //console.log("call overridden " + functName);
            var element = old.apply(this, arguments);
            if (element == null) {
                return null;
            }
            if (Object.prototype.toString.call(element) === '[object HTMLCollection]' ||
                Object.prototype.toString.call(element) === '[object NodeList]') {
                for (var i = 0; i < element.length; ++i) {
                    var el = element[i];
                    //console.log("elements list inject " + functName);
                    inject(el);
                }
            } else {
                //console.log("element inject " + functName);
                inject(element);
            }

            return element;
        }
    }

    function inject(element) {
        if (element.tagName.toUpperCase() === "IFRAME") {
            if (element.contentDocument == null) {
                //console.log("iframe contentDocument is null");
                return;
            }
            override(element.contentDocument, "createElement");
            override(element.contentDocument, "createElementNS");
            override(element.contentDocument, "getElementById");
            override(element.contentDocument, "getElementsByName");
            override(element.contentDocument, "getElementsByClassName");
            override(element.contentDocument, "getElementsByTagName");
            override(element.contentDocument, "getElementsByTagNameNS");
        } else if (element.tagName.toUpperCase() === "CANVAS") {
            var ctx = element.getContext("2d");
            injectCanvas(ctx, element.height, element.width);
        }
    }

    function injectCanvas(ctx, height, width) {
        //console.log("canvas  h:" + height + " w:" + width);
        //console.log("inject canvas");

        var origGetImageData = ctx.getImageData;
        var origPutImageData = ctx.putImageData;

        function overrideCanvas(ctx, functName) {
            var old = ctx[functName];
            ctx[functName] = function () {
                //console.log("call canvas overridden " + functName);
                old.apply(this, arguments);

                var imageData = origGetImageData.call(ctx, 0, 0, width, height);
                for (var i = 0; i < height; i++) {
                    for (var j = 0; j < width; j++) {
                        var index = ((i * (width * 4)) + (j * 4));
                        imageData.data[index + 0] = imageData.data[index + 0] + r;
                        imageData.data[index + 1] = imageData.data[index + 1] + g;
                        imageData.data[index + 2] = imageData.data[index + 2] + b;
                        imageData.data[index + 3] = imageData.data[index + 3] + a;
                    }
                }
                origPutImageData.call(ctx, imageData, 0, 0);
            }
        }

        // Drawing rectangles
        overrideCanvas(ctx, "clearRect");
        overrideCanvas(ctx, "fillRect");
        overrideCanvas(ctx, "strokeRect");
        //Drawing text
        overrideCanvas(ctx, "fillText");
        overrideCanvas(ctx, "strokeText");

        //Drawing paths
        overrideCanvas(ctx, "fill");
        //overrideCanvas(ctx, "stroke");
        overrideCanvas(ctx, "drawFocusIfNeeded");
        overrideCanvas(ctx, "scrollPathIntoView");
        overrideCanvas(ctx, "clip");
        overrideCanvas(ctx, "isPointInPath");
        overrideCanvas(ctx, "isPointInStroke");

        //Drawing images
        overrideCanvas(ctx, "drawImage");

        overrideCanvas(ctx, "putImageData");
        overrideCanvas(ctx, "getImageData");
    }

    override(document, "createElement");
    override(document, "createElementNS");
    override(document, "getElementById");
    override(document, "getElementsByName");
    override(document, "getElementsByClassName");
    override(document, "getElementsByTagName");
    override(document, "getElementsByTagNameNS");

    var scriptNode = document.getElementById("anticanvasfingerprinting");
    scriptNode.parentNode.removeChild(scriptNode);
}

var script = document.createElement("script");
script.id = "anticanvasfingerprinting";
script.type = "text/javascript";
var newChild = document.createTextNode('try{(' + main + ')(' + self.options.r + ',' + self.options.g + ',' + self.options.b + ',' + self.options.a + ');} catch (e) {}');
script.appendChild(newChild);
var node = (document.documentElement || document.head || document.body);
if (typeof node[self.options.docId] === 'undefined') {
    node.insertBefore(script, node.firstChild);
    node[self.options.docId] = getRandomString();
}

function getRandomString() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 5; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}