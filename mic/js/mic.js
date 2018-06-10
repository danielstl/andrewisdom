/*
***********************************************************************************
ORIGINAL SOURCE: https://github.com/cwilso/volume-meter/blob/master/volume-meter.js
***********************************************************************************

The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


var andre;
var connected = false;

document.onmousedown = () => {
    if (connected) return;

    andre = document.getElementById("chin");
    navigator.mediaDevices.getUserMedia(
        {
            audio: {
                mandatory: {
                    googHighpassFilter: false,
                    googNoiseSuppression: false,
                    googAutoGainControl: false,
                    googEchoCancellation: false
                }
            }
        }
    )
    .then(connectToStream)
    .catch((err) => {
        alert("Error: " + err);

        document.getElementsByTagName("red")[0].style.background = "green";
    });
};

function connectToStream(stream) {
    connected = true;

    document.getElementsByTagName("body")[0].style.background = "green";

    let audioContext = new AudioContext();

    let mediaStream = audioContext.createMediaStreamSource(stream);

    let processor = audioContext.createScriptProcessor(512);

    mediaStream.connect(processor);

	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = 0.98;
	processor.averaging = 0.95;
	processor.clipLag = 750;

    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
        let input = e.inputBuffer.getChannelData(0);
        let sum = 0;
   
        for (let i = 0; i < input.length; i++) {
            let vol = input[i];

            if (Math.abs(vol) >= processor.clipLevel) {
                processor.clipping = true;
                processor.lastClip = window.performance.now();
            }

            sum += vol * vol;
        }
    
        let avg = Math.sqrt(sum / input.length); //get average of input volumes
    
        processor.volume = Math.max(avg, processor.volume * processor.averaging);
        
        requestAnimationFrame(() => {
            andre.style.transform = `rotate(${-200 * Math.max(0.1, processor.volume)}deg)`; //change chin transform relative to volume
        });
    }

    processor.shutdown = () => {
        processor.disconnect();
        processor.onaudioprocess = null;
    }
}