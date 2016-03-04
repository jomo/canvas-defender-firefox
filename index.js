const {Cc, Ci} = require('chrome');

var ss = require("sdk/simple-storage");
var data;

var storageData = ss.storage.data;
if (storageData == undefined) {
    generateNewFingerPrint();
} else {
    data = JSON.parse(storageData);
    console.log("r" + data.r + "g" + data.g + "b" + data.b + "a" + data.a);
}

var pageMod;

var docId = getRandomString();
function inject() {
    pageMod = require("sdk/page-mod").PageMod({
        include: "*",
        contentScriptFile: "./content.js",
        contentScriptWhen: "start",
        contentScriptOptions: {
            r: data.r,
            g: data.g,
            b: data.b,
            a: data.a,
            docId: docId
        }
    });
}

inject();

require('sdk/ui/button/action').ActionButton({
    id: "canvas-shadow-generate-canvas-noise",
    label: "Create & use new canvas fingerprint",
    icon: {
        "16": "./16x16.png",
        "32": "./48x48.png",
        "64": "./128x128.png"
    },
    onClick: function () {
        generateNewFingerPrint();
        pageMod.destroy();
        inject();

        var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
        prompts.alert(null, "AntiCanvasFingerprinting - by MultiLoginApp.com", "Generated a new noise for canvas");
    }
});

function generateNewFingerPrint() {
    data = {};
    data.r = 10 - randomIntFromInterval(0, 20);
    data.g = 10 - randomIntFromInterval(0, 20);
    data.b = 10 - randomIntFromInterval(0, 20);
    data.a = 10 - randomIntFromInterval(0, 20);
    ss.storage.data = JSON.stringify(data);
    console.log("r" + data.r + "g" + data.g + "b" + data.b + "a" + data.a);
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomString() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 5; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
}