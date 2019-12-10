import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import RTCMultiConnection from "../../dist/RTCMultiConnection.min";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";

const style = require("./index.css");

const connection = new (RTCMultiConnection as any)();

// 首先要计算params

connection.socketURL = "http://localhost:9000";
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketURL = "/";
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketMessageEvent = "canvas-dashboard-demo";

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

const Room: React.FC = () => {
  const params = new URLSearchParams(window.location.hash.slice(6)) as any;
  connection.extra.userFullName = params.userFullName;
  connection.publicRoomIdentifier = params.publicRoomIdentifier;
  const designer = useRef(new (window as any).CanvasDesigner());

  const getFullName = (userid: string) => {
    var _userFullName = userid;
    if (
      connection.peers[userid] &&
      connection.peers[userid].extra.userFullName
    ) {
      _userFullName = connection.peers[userid].extra.userFullName;
    }
    return _userFullName;
  };

  const appendChatMessage = (event: any, checkmark_id?: string) => {
    let div = document.createElement("div");
    let conversationPanel = document.getElementById(
      "conversation-panel"
    ) as HTMLDivElement;
    div.className = "message";

    if (event.data) {
      div.innerHTML =
        "<b>" +
        (event.extra.userFullName || event.userid) +
        ":</b><br>" +
        event.data.chatMessage;

      if (event.data.checkmark_id) {
        connection.send({
          checkmark: "received",
          checkmark_id: event.data.checkmark_id
        });
      }
    } else {
      div.innerHTML =
        '<b>You:</b> <img class="checkmark" id="' +
        checkmark_id +
        '" title="Received" src="https://www.webrtc-experiment.com/images/checkmark.png"><br>' +
        event;
      div.style.background = "#cbffcb";
    }

    conversationPanel.appendChild(div);

    conversationPanel.scrollTop = conversationPanel.clientHeight;
    conversationPanel.scrollTop =
      conversationPanel.scrollHeight - conversationPanel.scrollTop;
  };

  useEffect(() => {
    designer.current.widgetHtmlURL = "widget.html";
    designer.current.widgetJsURL = "widget.min.js";
    designer.current.addSyncListener(function(data: any) {
      connection.send(data);
    });
    designer.current.setSelected("pencil");
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
  }, []); // 这里网上都是初始化canvas-designer

  useEffect(() => {
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

    connection.onUserStatusChanged = function(event: any) {
      const infoBar = document.getElementById("onUserStatusChanged");
      let names: Array<string> = [];
      connection.getAllParticipants().map((pid: string) => {
        names.push(getFullName(pid));
      });

      if (!names.length) {
        names = ["Only You"];
      } else {
        names = [connection.extra.userFullName || "You"].concat(names);
      }

      infoBar &&
        (infoBar.innerHTML = "<b>Active users:</b> " + names.join(", "));
    };

    connection.onopen = function(event: any) {
      connection.onUserStatusChanged(event);

      if (designer.current.pointsLength <= 0) {
        // make sure that remote user gets all drawings synced.
        setTimeout(function() {
          connection.send("plz-sync-points");
        }, 1000);
      }

      (document.getElementById("btn-chat-message") as any).disabled = false;
      document.getElementById("btn-attach-file")!.style.display =
        "inline-block";
      document.getElementById("btn-share-screen")!.style.display =
        "inline-block";
    };

    connection.onclose = connection.onerror = connection.onleave = function(
      event: any
    ) {
      connection.onUserStatusChanged(event);
    };

    connection.onmessage = function(event: any) {
      if (event.data.showMainVideo) {
        // $('#main-video').show();
        let top = ($("#widget-container").offset() as any).top,
          left = ($("#widget-container").offset() as any).left,
          width = $("#widget-container")!.width() as any,
          height = $("#widget-container")!.height() as any;

        $("#screen-viewer").css("top", top);
        $("#screen-viewer").css("left", left);
        $("#screen-viewer").css("width", width);
        $("#screen-viewer").css("height", height);
        $("#screen-viewer").show();
        return;
      }

      if (event.data.hideMainVideo) {
        // $('#main-video').hide();
        $("#screen-viewer").hide();
        return;
      }

      if (event.data.typing === true) {
        $("#key-press")
          .show()
          .find("span")
          .html(event.extra.userFullName + " is typing");
        return;
      }

      if (event.data.typing === false) {
        $("#key-press")
          .hide()
          .find("span")
          .html("");
        return;
      }

      if (event.data.chatMessage) {
        appendChatMessage(event);
        return;
      }

      if (event.data.checkmark === "received") {
        var checkmarkElement = document.getElementById(event.data.checkmark_id);
        if (checkmarkElement) {
          checkmarkElement.style.display = "inline";
        }
        return;
      }

      if (event.data === "plz-sync-points") {
        designer.current.sync();
        return;
      }

      designer.current.syncData(event.data);
    };

    // extra code

    connection.onstream = function(event: any) {
      if (event.stream.isScreen && !event.stream.canvasStream) {
        ($("#screen-viewer").get(0) as any).srcObject = event.stream;
        $("#screen-viewer").hide();
      } else if (event.extra.roomOwner === true) {
        var video = document.getElementById("main-video") as any;
        if (!video) return;
        video.setAttribute("data-streamid", event.streamid);
        // video.style.display = 'none';
        if (event.type === "local") {
          video.muted = true;
          video.volume = 0;
        }
        video.srcObject = event.stream;
        $("#main-video").show();
      } else {
        event.mediaElement.controls = false;

        var otherVideos = document.querySelector("#other-videos");
        otherVideos && otherVideos.appendChild(event.mediaElement);
      }

      connection.onUserStatusChanged(event);
    };

    connection.onstreamended = function(event: any) {
      let video = document.querySelector(
        'video[data-streamid="' + event.streamid + '"]'
      ) as any;
      if (!video) {
        video = document.getElementById(event.streamid) as any;
        if (video) {
          video.parentNode.removeChild(video);
          return;
        }
      }
      if (video) {
        video.srcObject = null;
        video.style.display = "none";
      }
    };
  }, []);

  useEffect(() => {
    window.onkeyup = function(e) {
      var code = e.keyCode || e.which;
      if (code == 13) {
        $("#btn-chat-message").click();
      }
    };
  }, []);
  return (
    <>
      <div
        id="widget-container"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          left: "20%",
          height: "100%",
          border: "1px solid black",
          borderTop: 0,
          borderBottom: 0
        }}
      ></div>
      <video id="screen-viewer" controls playsinline autoPlay></video>

      <div
        style={{ width: "20%", height: "100%,", position: "absolute", left: 0 }}
      >
        <video id="main-video" controls playsinline autoPlay></video>
        <div id="other-videos"></div>
        <hr />
        <div style={{ padding: "5px 10px" }}>
          <div id="onUserStatusChanged"></div>
        </div>

        <div
          style={{
            marginTop: "20px",
            position: "absolute",
            bottom: 0,
            background: "white",
            paddingBottom: "20px",
            width: "94%"
          }}
        >
          <div id="conversation-panel"></div>
          <div
            id="key-press"
            style={{ textAlign: "right", display: "none", fontSize: "11px" }}
          >
            <span style={{ verticalAlign: "middle" }}></span>
            <img
              src="https://www.webrtc-experiment.com/images/key-press.gif"
              style={{ height: "12px", verticalAlign: "middle" }}
            ></img>
          </div>
          <textarea id="txt-chat-message"></textarea>
          <button className="btn btn-primary" id="btn-chat-message" disabled>
            Send
          </button>
          <img
            id="btn-attach-file"
            src="https://www.webrtc-experiment.com/images/attach-file.png"
            title="Attach a File"
          ></img>
          <img
            id="btn-share-screen"
            src="https://www.webrtc-experiment.com/images/share-screen.png"
            title="Share Your Screen"
          ></img>
        </div>

        <canvas id="temp-stream-canvas" style={{ display: "none" }}></canvas>
      </div>
    </>
  );
};

export default Room;
