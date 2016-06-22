var allowInjection = true;
if (window.frameElement != null && window.frameElement.sandbox != null) {
    allowInjection = false;
    for (var i = 0; i < window.frameElement.sandbox.length; i++) {
        var val = window.frameElement.sandbox[i];
        if (val == 'allow-scripts') {
            allowInjection = true;
        }
    }
}
function main(r, g, b, a, scriptId) {
    var scriptNode = document.getElementById(scriptId);
    var canvasElems = {};
    function overrideCanvasProto(root) {
        var orig = root.prototype.getContext;
        Object.defineProperty(root.prototype, "getContext",
            {
                value: function () {
                    var res = orig.apply(this, arguments);
                    canvasElems[res] = this;
                    return res;
                }
            }
        );
    }
    function overrideCanvaRendProto(root) {
        var getImageData = root.prototype.getImageData;
        var putImageData = root.prototype.putImageData;
        function overrideProtoFunct(old, name) {
            Object.defineProperty(root.prototype, name,
                {
                    value: function () {
                        //console.log(name + "call");
                        old.apply(this, arguments);
                        var canvasElem = canvasElems[this];
                        var width = 300;
                        var height = 150;
                        if (canvasElem) {
                            width = canvasElem.width;
                            height = canvasElem.height;
                        } else {
                            console.log("canvas size is unknown");
                        }
                        var imageData = getImageData.call(this, 0, 0, width, height);
                        for (var i = 0; i < height; i++) {
                            for (var j = 0; j < width; j++) {
                                var index = ((i * (width * 4)) + (j * 4));
                                imageData.data[index + 0] = imageData.data[index + 0] + r;
                                imageData.data[index + 1] = imageData.data[index + 1] + g;
                                imageData.data[index + 2] = imageData.data[index + 2] + b;
                                imageData.data[index + 3] = imageData.data[index + 3] + a;
                            }
                        }
                        putImageData.call(this, imageData, 0, 0);
                    }
                }
            );
        }
        overrideProtoFunct(root.prototype.clearRect, "clearRect");
        overrideProtoFunct(root.prototype.fillRect, "fillRect");
        overrideProtoFunct(root.prototype.strokeRect, "strokeRect");
        //Drawing text
        overrideProtoFunct(root.prototype.fillText, "fillText");
        overrideProtoFunct(root.prototype.strokeText, "strokeText");
        //TODO
        //   overrideProtoFunct(root.prototype.measureText, "measureText");
        //Drawing paths
        overrideProtoFunct(root.prototype.fill, "fill");
        //overrideProtoFunct(root.prototype.stroke, "stroke");
        overrideProtoFunct(root.prototype.drawFocusIfNeeded, "drawFocusIfNeeded");
        overrideProtoFunct(root.prototype.clip, "clip");
        overrideProtoFunct(root.prototype.isPointInPath, "isPointInPath");
        overrideProtoFunct(root.prototype.isPointInStroke, "isPointInStroke");
        //Drawing images
        overrideProtoFunct(root.prototype.drawImage, "drawImage");
        overrideProtoFunct(root.prototype.putImageData, "putImageData");
        overrideProtoFunct(root.prototype.getImageData, "getImageData");
    }
    function inject(element) {
        if (element.tagName.toUpperCase() === "IFRAME") {
            try {
                overrideCanvasProto(element.contentWindow.HTMLCanvasElement);
                overrideCanvaRendProto(element.contentWindow.CanvasRenderingContext2D);
                overrideDocumentProto(element.contentWindow.Document);
            } catch (e) {
                console.error(e);
            }
        }
    }
    function overrideDocumentProto(root) {
        function doOverrideDocumentProto(old, name) {
            Object.defineProperty(root.prototype, name,
                {
                    value: function () {
                        var element = old.apply(this, arguments);
                        //console.log(name+ " everridden call"+element);
                        if (element == null) {
                            return null;
                        }
                        if (Object.prototype.toString.call(element) === '[object HTMLCollection]' ||
                            Object.prototype.toString.call(element) === '[object NodeList]') {
                            for (var i = 0; i < element.length; ++i) {
                                var el = element[i];
                                //console.log("elements list inject " + name);
                                inject(el);
                            }
                        } else {
                            //console.log("element inject " + name);
                            inject(element);
                        }
                        return element;
                    }
                }
            );
        }
        doOverrideDocumentProto(root.prototype.createElement, "createElement");
        doOverrideDocumentProto(root.prototype.createElementNS, "createElementNS");
        doOverrideDocumentProto(root.prototype.getElementById, "getElementById");
        doOverrideDocumentProto(root.prototype.getElementsByClassName, "getElementsByClassName");
        doOverrideDocumentProto(root.prototype.getElementsByTagName, "getElementsByTagName");
        doOverrideDocumentProto(root.prototype.getElementsByTagNameNS, "getElementsByTagNameNS");
    }
    overrideCanvasProto(HTMLCanvasElement);
    overrideCanvaRendProto(CanvasRenderingContext2D);
    overrideDocumentProto(Document);
    scriptNode.parentNode.removeChild(scriptNode);
}
var script = document.createElement('script');
script.id = getRandomString();
script.type = "text/javascript";
if (allowInjection) {
    var newChild = document.createTextNode('try{(' + main + ')(' + self.options.r + ',' + self.options.g + ',' + self.options.b + ',' + self.options.a + ',"'+script.id+'");} catch (e) {console.error(e);}');
    script.appendChild(newChild);
    var node = (document.documentElement || document.head || document.body);
    if (typeof node[self.options.docId] === 'undefined') {
        node.insertBefore(script, node.firstChild);
        node[self.options.docId] = getRandomString();
    }
}
function getRandomString() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 5; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}