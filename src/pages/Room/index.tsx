import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
const RTCMulticonnection = require("../../dist/RTCMultiConnection.min");
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";

const style = require("./index.css");

const Room: React.FC = () => {
  const params = new URLSearchParams(
    window.location.hash.slice(6)
  ) as URLSearchParams;
  const designer = useRef(new (window as any).CanvasDesigner()); // 其实这个
  const progressHelper = useRef<any>({});
  const [recentFile, setRecentFile] = useState<any>();
  const connection = useRef<any>();

  /*****
   * 用于更新某个label吧我猜测是
   */
  const updateLabel = (progress: any, label: HTMLDivElement) => {
    if (progress.position == -1) return;
    var position = +progress.position.toFixed(2).split(".")[1] || 100;
    label.innerHTML = position + "%";
  };

  /***
   * 用于获取视频参与方的全称
   * ***/
  const getFullName = (userid: string) => {
    var _userFullName = userid;
    if (
      connection.current.peers[userid] &&
      connection.current.peers[userid].extra.userFullName
    ) {
      _userFullName = connection.current.peers[userid].extra.userFullName;
    }
    return _userFullName;
  };

  /****
   * 用于将chatMessage更新到dom
   */
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
        connection.current.send({
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

  /****
   * 用于在上传文件时更新文件
   */
  const getFileHTML = (file: any) => {
    var url = file.url || URL.createObjectURL(file);
    var attachment =
      '<a href="' +
      url +
      '" target="_blank" download="' +
      file.name +
      '">Download: <b>' +
      file.name +
      "</b></a>";
    if (file.name.match(/\.jpg|\.png|\.jpeg|\.gif/gi)) {
      attachment += '<br><img crossOrigin="anonymous" src="' + url + '">';
    } else if (file.name.match(/\.wav|\.mp3/gi)) {
      attachment += '<br><audio src="' + url + '" controls></audio>';
    } else if (file.name.match(/\.pdf|\.js|\.txt|\.sh/gi)) {
      attachment +=
        '<iframe class="inline-iframe" src="' + url + '"></iframe></a>';
    }
    return attachment;
  };

  function addStreamStopListener(stream: any, callback?: Function) {
    stream.addEventListener(
      "ended",
      function() {
        callback && callback();
        callback = function() {};
      },
      false
    );

    stream.addEventListener(
      "inactive",
      function() {
        callback && callback();
        callback = function() {};
      },
      false
    );

    stream.getTracks().forEach(function(track: any) {
      track.addEventListener(
        "ended",
        function() {
          callback && callback();
          callback = function() {};
        },
        false
      );

      track.addEventListener(
        "inactive",
        function() {
          callback && callback();
          callback = function() {};
        },
        false
      );
    });
  }

  function replaceTrack(videoTrack: any, screenTrackId?: string) {
    if (!videoTrack) return;
    if (videoTrack.readyState === "ended") {
      alert(
        'Can not replace an "ended" track. track.readyState: ' +
          videoTrack.readyState
      );
      return;
    }
    connection.current.getAllParticipants().forEach(function(pid: string) {
      var peer = connection.current.peers[pid].peer;
      if (!peer.getSenders) return;
      var trackToReplace = videoTrack;
      peer.getSenders().forEach(function(sender: any) {
        if (!sender || !sender.track) return;
        if (screenTrackId) {
          if (trackToReplace && sender.track.id === screenTrackId) {
            sender.replaceTrack(trackToReplace);
            trackToReplace = null;
          }
          return;
        }

        if (sender.track.id !== (window as any).tempStream.getTracks()[0].id)
          return;
        if (sender.track.kind === "video" && trackToReplace) {
          sender.replaceTrack(trackToReplace);
          trackToReplace = null;
        }
      });
    });
  }

  function replaceScreenTrack(stream: any) {
    stream.isScreen = true;
    stream.streamid = stream.id;
    stream.type = "local";

    // connection.current.attachStreams.push(stream);
    connection.current.onstream({
      stream: stream,
      type: "local",
      streamid: stream.id
      // mediaElement: video
    });

    var screenTrackId = stream.getTracks()[0].id;
    addStreamStopListener(stream, function() {
      connection.current.send({
        hideMainVideo: true
      });

      // $('#main-video').hide();
      $("#screen-viewer").hide();
      $("#btn-share-screen").show();
      replaceTrack((window as any).tempStream.getTracks()[0], screenTrackId);
    });

    stream.getTracks().forEach(function(track: any) {
      if (track.kind === "video" && track.readyState === "live") {
        replaceTrack(track);
      }
    });

    connection.current.send({
      showMainVideo: true
    });

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
  }

  useEffect(() => {
    designer.current.widgetHtmlURL = "widget.html";
    designer.current.widgetJsURL = "widget.min.js";
    designer.current.addSyncListener(function(data: any) {
      connection.current.send(data);
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
  }, []); // 这里往上都是初始化canvas-designer

  useEffect(() => {
    connection.current = new (RTCMulticonnection as any)();
    // 首先要计算params
    // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
    params.get("password") &&
      (connection.current.password = params.get("password"));
    connection.current.extra.userFullName = params.get("userFullName");
    connection.current.publicRoomIdentifier = params.get(
      "publicRoomIdentifier"
    );
    connection.current.socketURL = "/";
    // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    connection.current.socketMessageEvent = "canvas-dashboard-demo";

    // keep room opened even if owner leaves
    connection.current.autoCloseEntireSession = true;

    connection.current.enableScalableBroadcast = false;
    connection.current.maxParticipantsAllowed = 1000;
    // each relaying-user should serve only 1 users
    connection.current.maxRelayLimitPerUser = 1;
    /// owner离开时即关闭
    connection.current.chunkSize = 16000;
    connection.current.enableFileSharing = true;

    connection.current.session = {
      audio: true,
      video: true,
      data: true
    };
    connection.current.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    };

    connection.current.onUserStatusChanged = function(event: any) {
      console.log("user-state-changed");
      const infoBar = document.getElementById("onUserStatusChanged");
      let names: Array<string> = [];
      connection.current.getAllParticipants().map((pid: string) => {
        names.push(getFullName(pid));
      });

      if (!names.length) {
        names = ["Only You"];
      } else {
        names = [connection.current.extra.userFullName || "You"].concat(names);
      }

      infoBar &&
        (infoBar.innerHTML = "<b>Active users:</b> " + names.join(", "));
    };

    connection.current.onopen = function(event: any) {
      connection.current.onUserStatusChanged(event);

      if (designer.current.pointsLength <= 0) {
        // make sure that remote user gets all drawings synced.
        setTimeout(function() {
          connection.current.send("plz-sync-points");
          console.log("show data");
        }, 1000);
      }

      (document.getElementById("btn-chat-message") as any).disabled = false;
      document.getElementById("btn-attach-file")!.style.display =
        "inline-block";
      document.getElementById("btn-share-screen")!.style.display =
        "inline-block";
    };

    connection.current.onclose = connection.current.onerror = connection.current.onleave = function(
      event: any
    ) {
      connection.current.onUserStatusChanged(event);
    };

    connection.current.onmessage = function(event: any) {
      console.log(event);
      console.log(event.data);
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

    connection.current.onstream = function(event: any) {
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

      connection.current.onUserStatusChanged(event);
    };

    connection.current.onstreamended = function(event: any) {
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

    connection.current.onFileEnd = function(file: any) {
      var html = getFileHTML(file);
      var div = progressHelper.current[file.uuid].div;

      if (file.userid === connection.current.userid) {
        div.innerHTML = "<b>You:</b><br>" + html;
        div.style.background = "#cbffcb";

        if (recentFile) {
          recentFile.userIndex++;
          var nextUserId = connection.current.getAllParticipants()[
            recentFile.userIndex
          ];
          if (nextUserId) {
            connection.current.send(recentFile, nextUserId);
          } else {
            setRecentFile(null);
          }
        } else {
          setRecentFile(null);
        }
      } else {
        div.innerHTML = "<b>" + getFullName(file.userid) + ":</b><br>" + html;
      }
    };

    connection.current.onFileProgress = function(chunk: any, uuid: string) {
      var helper = progressHelper.current[chunk.uuid];
      helper.progress.value =
        chunk.currentPosition || chunk.maxChunks || helper.progress.max;
      updateLabel(helper.progress, helper.label);
    };

    connection.current.onFileStart = function(file: any) {
      let div = document.createElement("div");
      let conversationPanel = document.getElementById("conversation-panel");
      if (!conversationPanel) return;
      div.className = "message";

      if (file.userid === connection.current.userid) {
        var userFullName = file.remoteUserId;
        if (connection.current.peersBackup[file.remoteUserId]) {
          userFullName =
            connection.current.peersBackup[file.remoteUserId].extra
              .userFullName;
        }

        div.innerHTML =
          "<b>You (to: " +
          userFullName +
          "):</b><br><label>0%</label> <progress></progress>";
        div.style.background = "#cbffcb";
      } else {
        div.innerHTML =
          "<b>" +
          getFullName(file.userid) +
          ":</b><br><label>0%</label> <progress></progress>";
      }

      div.title = file.name;
      conversationPanel && conversationPanel.appendChild(div);
      progressHelper.current[file.uuid] = {
        div: div,
        progress: div.querySelector("progress"),
        label: div.querySelector("label")
      };
      progressHelper.current[file.uuid].progress.max = file.maxChunks;

      conversationPanel.scrollTop = conversationPanel.clientHeight;
      conversationPanel.scrollTop =
        conversationPanel.scrollHeight - conversationPanel.scrollTop;
    };
    designer.current.appendTo(
      document.getElementById("widget-container"),
      function() {
        if (params.get("open") === "true") {
          let tempStreamCanvas = document.getElementById(
            "temp-stream-canvas"
          ) as any; // 这个为啥不行，这个tempStreamCanvas是个什么函数呢 as HTMLCanvasElement;
          var tempStream = tempStreamCanvas.captureStream();
          tempStream.isScreen = true;
          tempStream.streamid = tempStream.id;
          tempStream.type = "local";
          connection.current.attachStreams.push(tempStream);
          (window as any).tempStream = tempStream;

          connection.current.extra.roomOwner = true;
          console.log(params.get("sessionid"));
          connection.current.open(params.get("sessionid"), function(
            isRoomOpened: boolean,
            roomid: string,
            error: string
          ) {
            if (error) {
              if (error === connection.current.errors.ROOM_NOT_AVAILABLE) {
                alert(
                  "Someone already created this room. Please either join or create a separate room."
                );
                return;
              }
              alert(error);
            }

            connection.current.socket.on("disconnect", function() {
              location.reload();
            });
          });
        } else {
          connection.current.join(params.get("sessionid"), function(
            isRoomJoined: boolean,
            roomid: string,
            error: string
          ) {
            console.log("这里出现了问题", params.get("sessionid"));
            if (error) {
              if (error === connection.current.errors.ROOM_NOT_AVAILABLE) {
                alert(
                  "This room does not exist. Please either create it or wait for moderator to enter in the room."
                );
                return;
              }
              if (error === connection.current.errors.ROOM_FULL) {
                alert("Room is full.");
                return;
              }
              if (error === connection.current.errors.INVALID_PASSWORD) {
                connection.current.password =
                  prompt("Please enter room password.") || "";
                if (!connection.current.password.length) {
                  alert("Invalid password.");
                  return;
                }
                connection.current.join(params.get("sessionid"), function(
                  isRoomJoined: boolean,
                  roomid: string,
                  error: string
                ) {
                  console.log(arguments);
                  if (error) {
                    alert(error);
                  }
                });
                return;
              }
              alert(error);
            }

            connection.current.socket.on("disconnect", function() {
              location.reload();
            });
          });
        }
      }
    );
    (window as any).connection = connection.current;
  }, []); // 这里都是初始化connection.current

  useEffect(() => {
    document.addEventListener("keydown", function(e: any) {
      var code = e.keyCode || e.which;
      if (code == 13) {
        $("#btn-chat-message").click();
      }
    });
  }, []); // 按下回车时自动输入内容

  useEffect(() => {
    let keyPressTimer: any = undefined;
    let numberOfKeys = 0;
    ($("#txt-chat-message") as any).emojioneArea({
      pickerPosition: "top",
      filtersPosition: "bottom",
      tones: false,
      autocomplete: true,
      inline: true,
      hidePickerOnBlur: true,
      events: {
        focus: function() {
          $(".emojionearea-category")
            .unbind("click")
            .bind("click", function() {
              $(".emojionearea-button-close").click();
            });
        },
        keyup: function(e: any) {
          var chatMessage = $(".emojionearea-editor").html();
          if (!chatMessage || !chatMessage.replace(/ /g, "").length) {
            connection.current.send({
              typing: false
            });
          }

          clearTimeout(keyPressTimer);
          numberOfKeys++;

          if (numberOfKeys % 3 === 0) {
            connection.current.send({
              typing: true
            });
          }

          keyPressTimer = setTimeout(function() {
            connection.current.send({
              typing: false
            });
          }, 1200);
        },
        blur: function() {
          // $('#btn-chat-message').click();
          connection.current.send({
            typing: false
          });
        }
      }
    });
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
        style={{
          width: "20%",
          height: "100%",
          position: "absolute",
          left: 0
        }}
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
          <button
            className="btn btn-primary"
            id="btn-chat-message"
            onClick={() => {
              var chatMessage = $(".emojionearea-editor").html();
              $(".emojionearea-editor").html("");

              if (!chatMessage || !chatMessage.replace(/ /g, "").length) return;
              console.log(chatMessage);
              var checkmark_id =
                connection.current.userid + connection.current.token();

              appendChatMessage(chatMessage, checkmark_id);

              connection.current.send({
                chatMessage: chatMessage,
                checkmark_id: checkmark_id
              });

              connection.current.send({
                typing: false
              });
            }}
          >
            Send
          </button>
          <img
            id="btn-attach-file"
            src="https://www.webrtc-experiment.com/images/attach-file.png"
            title="Attach a File"
            onClick={e => {
              const file = new (window as any).FileSelector(); // 这个也是外部引进来的，后面可以看看
              file.selectSingleFile(function(
                file: File & { userIndex: number }
              ) {
                if (connection.current.getAllParticipants().length >= 1) {
                  file.userIndex = 0;
                  connection.current.send(
                    file,
                    connection.current.getAllParticipants()[0]
                  );
                }
                setRecentFile(file);
              });
            }}
          ></img>
          <img
            id="btn-share-screen"
            src="https://www.webrtc-experiment.com/images/share-screen.png"
            title="Share Your Screen"
            onClick={() => {
              if (!(window as any).tempStream) {
                alert("Screen sharing is not enabled.");
                return;
              }

              $("#btn-share-screen").hide();

              if ((navigator.mediaDevices as any).getDisplayMedia) {
                (navigator.mediaDevices as any)
                  .getDisplayMedia((window as any).screen_constraints)
                  .then(
                    (stream: any) => {
                      replaceScreenTrack(stream);
                    },
                    (error: any) => {
                      alert("Please make sure to use Edge 17 or higher.");
                    }
                  );
              } else if ((navigator as any).getDisplayMedia) {
                (navigator as any)
                  .getDisplayMedia((window as any).screen_constraints)
                  .then(
                    (stream: any) => {
                      replaceScreenTrack(stream);
                    },
                    (error: any) => {
                      alert("Please make sure to use Edge 17 or higher.");
                    }
                  );
              } else {
                alert("getDisplayMedia API is not available in this browser.");
              }
            }}
          ></img>
        </div>

        <canvas id="temp-stream-canvas" style={{ display: "none" }}></canvas>
      </div>
    </>
  );
};

export default Room;
