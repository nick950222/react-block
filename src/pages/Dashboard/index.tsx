import React from 'react';
import RTCMultiConnection from '../../dist/RTCMultiConnection.min'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap';
import 'socket.io'

const style = require('./index.css')

const DashBoard : React.FC = ()=>{
        return <div>
    <div id="widget-container" style="position: fixed;bottom: 0;right: 0;left: 20%;height: 100%;border: 1px solid black; border-top:0; border-bottom: 0;"></div>
<video id="screen-viewer" controls playsinline autoplay></video>

<div style="width: 20%; height: 100%; position: absolute;left:0;">
    <video id="main-video" controls playsinline autoplay></video>
    <div id="other-videos"></div>
    <hr/>
    <div style="padding: 5px 10px;">
        <div id="onUserStatusChanged"></div>
    </div>

    <div style="margin-top: 20px;position: absolute;bottom: 0;background: white; padding-bottom: 20px; width: 94%">
        <div id="conversation-panel"></div>
        <div id="key-press" style="text-align: right; display: none; font-size: 11px;">
            <span style="vertical-align: middle;"></span>
            <img src="https://www.webrtc-experiment.com/images/key-press.gif" style="height: 12px; vertical-align: middle;"/>
        </div>
        <textarea id="txt-chat-message"></textarea>
        <button class="btn btn-primary" id="btn-chat-message" disabled>Send</button>
        <img id="btn-attach-file" src="https://www.webrtc-experiment.com/images/attach-file.png" title="Attach a File"/>
        <img id="btn-share-screen" src="https://www.webrtc-experiment.com/images/share-screen.png" title="Share Your Screen"/>
    </div>

    <canvas id="temp-stream-canvas" style="display: none;"></canvas>
    </div>
    </div>
    }

export default DashBoard;