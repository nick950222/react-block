import React from 'react';
import {useState,useEffect,useCallback,useRef} from 'react'
import RTCMultiConnection from '../../dist/RTCMultiConnection.min'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap';

const style = require('./index.css')

const connection = new (RTCMultiConnection as any)();

// 首先要计算params 

connection.socketURL = 'http://localhost:9000';
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketURL = '/';
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';


connection.socketMessageEvent = 'canvas-dashboard-demo';

// keep room opened even if owner leaves
connection.autoCloseEntireSession = true;

connection.enableScalableBroadcast = true;

// each relaying-user should serve only 1 users
connection.maxRelayLimitPerUser = 1;
/// owner离开时即关闭
// connection.connectSocket(function(socket) {
//     socket.on('logs', function(log) {
//         document.querySelector('h1').innerHTML = log.replace(/</g, '----').replace(/>/g, '___').replace(/----/g, '(<span style="color:red;">').replace(/___/g, '</span>)');
//     });

//     // this event is emitted when a broadcast is already created.
//     socket.on('join-broadcaster', function(hintsToJoinBroadcast) {
//         console.log('join-broadcaster', hintsToJoinBroadcast);

//         connection.session = hintsToJoinBroadcast.typeOfStreams;
//         connection.sdpConstraints.mandatory = {
//             OfferToReceiveVideo: !!connection.session.video,
//             OfferToReceiveAudio: !!connection.session.audio
//         };
//         connection.broadcastId = hintsToJoinBroadcast.broadcastId;
//         connection.join(hintsToJoinBroadcast.userid);
//     });

//     socket.on('rejoin-broadcast', function(broadcastId) {
//         console.log('rejoin-broadcast', broadcastId);

//         connection.attachStreams = [];
//         socket.emit('check-broadcast-presence', broadcastId, function(isBroadcastExists) {
//             if (!isBroadcastExists) {
//                 // the first person (i.e. real-broadcaster) MUST set his user-id
//                 connection.userid = broadcastId;
//             }

//             socket.emit('join-broadcast', {
//                 broadcastId: broadcastId,
//                 userid: connection.userid,
//                 typeOfStreams: connection.session
//             });
//         });
//     });

//     socket.on('broadcast-stopped', function(broadcastId) {
//         // alert('Broadcast has been stopped.');
//         // location.reload();
//         console.error('broadcast-stopped', broadcastId);
//         alert('This broadcast has been stopped.');
//     });

//     // this event is emitted when a broadcast is absent.
//     socket.on('start-broadcasting', function(typeOfStreams) {
//         console.log('start-broadcasting', typeOfStreams);

//         // host i.e. sender should always use this!
//         connection.sdpConstraints.mandatory = {
//             OfferToReceiveVideo: false,
//             OfferToReceiveAudio: false
//         };
//         connection.session = typeOfStreams;

//         // "open" method here will capture media-stream
//         // we can skip this function always; it is totally optional here.
//         // we can use "connection.getUserMediaHandler" instead
//         connection.open(connection.userid);
//     });
// });
    
const Room : React.FC = ()=>{
    const params = new URLSearchParams(window.location.hash.slice(6)) as any
    connection.extra.userFullName = params.userFullName;
    connection.publicRoomIdentifier = params.publicRoomIdentifier;
    const designer = useRef(new (window as any).CanvasDesigner)

    useEffect(()=>{
        designer.current.widgetHtmlURL = 'widget.html'
        designer.current.widgetJsURL = 'widget.min.js'
        designer.current.addSyncListener(function(data : any) {
            connection.send(data);
        });
        designer.current.setSelected('pencil');
        designer.current.setTools({
            pencil: true,
            text: true,
            image: true,
            pdf: true,
            eraser: true,
            line: true,
            arrow: true,
            dragSingle: true,
            dragMultiple: true,
            arc: true,
            rectangle: true,
            quadratic: false,
            bezier: true,
            marker: true,
            zoom: false,
            lineWidth: false,
            colorsPicker: false,
            extraOptions: false,
            code: false,
            undo: true
        });
    },[]) // 这里网上都是初始化canvas-designer

    useEffect(()=>{
        connection.chunkSize = 16000;
connection.enableFileSharing = true;

connection.session = {
    audio: true,
    video: true,
    data: true
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

connection.onUserStatusChanged = function(event) {
    var infoBar = document.getElementById('onUserStatusChanged');
    var names = [];
    connection.getAllParticipants().forEach(function(pid) {
        names.push(getFullName(pid));
    });

    if (!names.length) {
        names = ['Only You'];
    } else {
        names = [connection.extra.userFullName || 'You'].concat(names);
    }

    infoBar.innerHTML = '<b>Active users:</b> ' + names.join(', ');
};

connection.onopen = function(event) {
    connection.onUserStatusChanged(event);

    if (designer.pointsLength <= 0) {
        // make sure that remote user gets all drawings synced.
        setTimeout(function() {
            connection.send('plz-sync-points');
        }, 1000);
    }

    document.getElementById('btn-chat-message').disabled = false;
    document.getElementById('btn-attach-file').style.display = 'inline-block';
    document.getElementById('btn-share-screen').style.display = 'inline-block';
};

connection.onclose = connection.onerror = connection.onleave = function(event) {
    connection.onUserStatusChanged(event);
};

connection.onmessage = function(event) {
    if(event.data.showMainVideo) {
        // $('#main-video').show();
        $('#screen-viewer').css({
            top: $('#widget-container').offset().top,
            left: $('#widget-container').offset().left,
            width: $('#widget-container').width(),
            height: $('#widget-container').height()
        });
        $('#screen-viewer').show();
        return;
    }

    if(event.data.hideMainVideo) {
        // $('#main-video').hide();
        $('#screen-viewer').hide();
        return;
    }

    if(event.data.typing === true) {
        $('#key-press').show().find('span').html(event.extra.userFullName + ' is typing');
        return;
    }

    if(event.data.typing === false) {
        $('#key-press').hide().find('span').html('');
        return;
    }

    if (event.data.chatMessage) {
        appendChatMessage(event);
        return;
    }

    if (event.data.checkmark === 'received') {
        var checkmarkElement = document.getElementById(event.data.checkmark_id);
        if (checkmarkElement) {
            checkmarkElement.style.display = 'inline';
        }
        return;
    }

    if (event.data === 'plz-sync-points') {
        designer.sync();
        return;
    }

    designer.syncData(event.data);
};

// extra code

connection.onstream = function(event) {
    if (event.stream.isScreen && !event.stream.canvasStream) {
        $('#screen-viewer').get(0).srcObject = event.stream;
        $('#screen-viewer').hide();
    }
    else if (event.extra.roomOwner === true) {
        var video = document.getElementById('main-video');
        video.setAttribute('data-streamid', event.streamid);
        // video.style.display = 'none';
        if(event.type === 'local') {
            video.muted = true;
            video.volume = 0;
        }
        video.srcObject = event.stream;
        $('#main-video').show();
    } else {
        event.mediaElement.controls = false;

        var otherVideos = document.querySelector('#other-videos');
        otherVideos.appendChild(event.mediaElement);
    }

    connection.onUserStatusChanged(event);
};

connection.onstreamended = function(event) {
    var video = document.querySelector('video[data-streamid="' + event.streamid + '"]');
    if (!video) {
        video = document.getElementById(event.streamid);
        if (video) {
            video.parentNode.removeChild(video);
            return;
        }
    }
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
};
    },[])

    return (
        <div>
            <a href="#/">回dashboard</a>
        </div>
    )
}

export default Room;