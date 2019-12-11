import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
const RTCMulticonnection = require("../../dist/RTCMultiConnection.min");
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";

const style = require("./index.css");
const publicRoomIdentifier = "dashboard";

const DashBoard: React.FC = () => {
  const [roomList, setRoomList] = useState(new Array());
  const [timer, setTimer] = useState();
  const connection = useRef<any>();
  const loopGetRoomList = () => {
    connection.current.socket.emit(
      "get-public-rooms",
      publicRoomIdentifier,
      function(listOfRooms: any) {
        setRoomList(listOfRooms);
        setTimer(setTimeout(loopGetRoomList, 3000));
      }
    );
  };

  const joinAHiddenRoom = (roomid: string) => {
    var initialHTML = $("#btn-join-hidden-room").html();

    $("#btn-join-hidden-room")
      .html("Please wait...")
      .prop("disabled", true);

    connection.current.checkPresence(roomid, function(isRoomExist: boolean) {
      if (isRoomExist === false) {
        alertBox(
          "No such room exist on this server. Room-id: " + roomid,
          "Room Not Found"
        );
        $("#btn-join-hidden-room")
          .html(initialHTML)
          .prop("disabled", false);
        return;
      }

      connection.current.sessionid = roomid;
      connection.current.isInitiator = false;
      ($("#joinRoomModel") as any).modal("hide");
      openCanvasDesigner();

      $("#btn-join-hidden-room")
        .html(initialHTML)
        .prop("disabled", false);
    });
  };

  const openCanvasDesigner = () => {
    ($("#startRoomModel") as any).modal("hide");
    var search =
      "?open=" +
      connection.current.isInitiator +
      "&sessionid=" +
      connection.current.sessionid +
      "&publicRoomIdentifier=" +
      connection.current.publicRoomIdentifier +
      "&userFullName=" +
      connection.current.extra.userFullName;

    if (!!connection.current.password) {
      search += "&password=" + connection.current.password;
    }

    let href = location.href + "room" + search;
    var newWin = window.open(href);

    if (!newWin || newWin.closed || typeof newWin.closed == "undefined") {
      var html = "";
      html += "<p>Please click following link:</p>";
      html += '<p><a href="' + href + '" target="_blank">';
      if (connection.current.isInitiator) {
        html += "Click To Open The Room";
      } else {
        html += "Click To Join The Room";
      }
      html += "</a></p>";
      alertBox(html, "Popups Are Blocked");
    }
  };

  const alertBox = (
    message: string,
    title: string,
    specialMessage?: string,
    callback?: Function
  ) => {
    $(".btn-alert-close")
      .unbind("click")
      .bind("click", function(e) {
        e.preventDefault();
        ($("#alert-box") as any).modal("hide");
        $("#confirm-box-topper").hide();

        callback && callback();
      });

    $("#alert-title").html(title || "Alert");
    $("#alert-special").html(specialMessage || "");
    $("#alert-message").html(message);
    $("#confirm-box-topper").show();

    ($("#alert-box") as any).modal({
      backdrop: "static",
      keyboard: false
    });
  };

  function confirmBox(message: string, callback: Function) {
    $("#btn-confirm-action")
      .html("Confirm")
      .unbind("click")
      .bind("click", function(e) {
        e.preventDefault();
        ($("#confirm-box") as any).modal("hide");
        $("#confirm-box-topper").hide();
        callback(true);
      });

    $("#btn-confirm-close").html("Cancel");

    $(".btn-confirm-close")
      .unbind("click")
      .bind("click", function(e) {
        e.preventDefault();
        ($("#confirm-box") as any).modal("hide");
        $("#confirm-box-topper").hide();
        callback(false);
      });

    $("#confirm-message").html(message);
    $("#confirm-title").html("Please Confirm");
    $("#confirm-box-topper").show();

    ($("#confirm-box") as any).modal({
      backdrop: "static",
      keyboard: false
    });
  }
  useEffect(() => {
    connection.current = new (RTCMulticonnection as any)();
    (window as any).connection = connection.current;
    connection.current.socketURL = "/";
    // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

    /// make this room public
    connection.current.publicRoomIdentifier = publicRoomIdentifier;
    connection.current.socketMessageEvent = publicRoomIdentifier;

    // keep room opened even if owner leaves
    connection.current.autoCloseEntireSession = true;

    connection.current.connectSocket(function(socket: any) {
      loopGetRoomList(); // 在socket连接成功之后开始轮询获取所有的room
      socket.on("disconnect", () => {
        location.reload();
      });
    });
  }, []);

  return (
    <div>
      <header style={{ marginBottom: "20px" }}>
        <span className="logo-text">区块链直播间控制台</span>

        <div style={{ float: "right", marginTop: "15px" }}>
          <button
            className="btn btn-primary"
            data-toggle="modal"
            data-target="#startRoomModel"
          >
            创建新房间
          </button>
          <button
            id="btn-show-join-hidden-room"
            className="top-span btn btn-secondary"
            data-toggle="modal"
            data-target="#joinRoomModel"
            onClick={e => {
              e.preventDefault();
              $("#txt-room-password-hidden")
                .parent()
                .hide();
              ($("#joinRoomModel") as any).modal("show");
            }}
          >
            加入房间
          </button>
          <span className="top-span">
            活跃房间数: <span id="active-rooms">{roomList.length}</span>
          </span>
        </div>
      </header>
      <div
        className="modal fade"
        id="startRoomModel"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="startRoomModelLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="startRoomModelLabel">
                Create A New Room
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body" style={{ paddingBottom: 0 }}>
              <form>
                <div className="form-group">
                  <p>
                    <label className="col-form-label">Enter Room ID:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="txt-roomid"
                    ></input>
                  </p>

                  <p>
                    <label className="col-form-label">Enter Your Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="txt-user-name"
                    ></input>
                  </p>

                  <p style={{ display: "none" }}>
                    <label className="col-form-label">
                      Enter Room Password:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="txt-room-password"
                    ></input>
                  </p>

                  <a
                    href=""
                    style={{
                      float: "right",
                      marginBottom: "10px",
                      fontSize: "14px"
                    }}
                    onClick={() => {}}
                  >
                    Show More Options
                  </a>

                  <p
                    className="more-options"
                    style={{ marginBottom: 0, display: "none" }}
                  >
                    <label className="col-form-label">
                      <input
                        type="checkbox"
                        id="chk-room-password"
                        onChange={(e: any) => {
                          $("#txt-room-password")
                            .parent()
                            .css(
                              "display",
                              e.target.checked === true ? "block" : "none"
                            );
                          $("#txt-room-password").focus();
                        }}
                      />{" "}
                      Set Room Password?
                    </label>
                  </p>

                  <p
                    className="more-options"
                    style={{ marginTop: 0, marginBottom: 0, display: "none" }}
                  >
                    <label className="col-form-label">
                      <input type="checkbox" id="chk-hidden-room" /> Hidden
                      Room? (Hide from the list)
                    </label>
                  </p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" data-dismiss="modal">
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                id="btn-create-room"
                onClick={() => {
                  var roomid = $("#txt-roomid")
                    .val()!
                    .toString();
                  if (!roomid || !roomid.replace(/ /g, "").length) {
                    alertBox("Please enter room-id.", "Room ID Is Required");
                    return;
                  }

                  var fullName = $("#txt-user-name")
                    .val()!
                    .toString();
                  if (!fullName || !fullName.replace(/ /g, "").length) {
                    alertBox(
                      "Please enter your name.",
                      "Your Name Is Required"
                    );
                    return;
                  }

                  connection.current.extra.userFullName = fullName;

                  if ($("#chk-room-password").prop("checked") === true) {
                    var roomPassword = $("#txt-room-password")
                      .val()!
                      .toString();
                    if (
                      !roomPassword ||
                      !roomPassword.replace(/ /g, "").length
                    ) {
                      alertBox(
                        "Please enter room password.",
                        "Password Box Is Empty"
                      );
                      return;
                    }

                    connection.current.password = roomPassword;
                  }

                  var initialHTML = $("#btn-create-room").html();

                  $("#btn-create-room")
                    .html("Please wait...")
                    .prop("disabled", true);

                  connection.current.checkPresence(roomid, function(
                    isRoomExist: boolean
                  ) {
                    if (isRoomExist === true) {
                      alertBox(
                        "This room-id is already taken and room is active. Please join instead.",
                        "Room ID In Use"
                      );
                      return;
                    }

                    if ($("#chk-hidden-room").prop("checked") === true) {
                      // either make it unique!
                      // connection.current.publicRoomIdentifier = connection.current.token() + connection.current.token();

                      // or set an empty value (recommended)
                      connection.current.publicRoomIdentifier = "";
                    }

                    connection.current.sessionid = roomid;
                    connection.current.isInitiator = true;
                    openCanvasDesigner();
                    $("#btn-create-room")
                      .html(initialHTML)
                      .prop("disabled", false);
                  });
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="joinRoomModel"
        tabIndex={-1}
        role="dialog"
        aria-labelledby="joinRoomModelLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="joinRoomModelLabel">
                Join A Room
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <p>
                    <label className="col-form-label">Enter Room ID:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="txt-roomid-hidden"
                    />
                  </p>

                  <p>
                    <label className="col-form-label">Enter Your Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      id="txt-user-name-hidden"
                    />
                  </p>

                  <p style={{ display: "none" }}>
                    <label className="col-form-label">
                      Enter Room Password:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="txt-room-password-hidden"
                    />
                  </p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" data-dismiss="modal">
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                id="btn-join-hidden-room"
                onClick={() => {
                  var roomid = $("#txt-roomid-hidden")
                    .val()!
                    .toString();
                  if (!roomid || !roomid.replace(/ /g, "").length) {
                    alertBox("Please enter room-id.", "Room ID Is Required");
                    return;
                  }

                  var fullName = $("#txt-user-name-hidden")
                    .val()!
                    .toString();
                  if (!fullName || !fullName.replace(/ /g, "").length) {
                    alertBox(
                      "Please enter your name.",
                      "Your Name Is Required"
                    );
                    return;
                  }

                  connection.current.extra.userFullName = fullName;

                  if (
                    $("#txt-room-password-hidden")
                      .parent()
                      .css("display") !== "none"
                  ) {
                    var roomPassword = $("#txt-room-password-hidden")
                      .val()!
                      .toString();
                    if (
                      !roomPassword ||
                      !roomPassword.replace(/ /g, "").length
                    ) {
                      alertBox(
                        "Please enter room password.",
                        "Password Box Is Empty"
                      );
                      return;
                    }
                    connection.current.password = roomPassword;

                    connection.current.socket.emit(
                      "is-valid-password",
                      connection.current.password,
                      roomid,
                      function(
                        isValidPassword: boolean,
                        roomid: string,
                        error: string
                      ) {
                        if (isValidPassword === true) {
                          joinAHiddenRoom(roomid);
                        } else {
                          alertBox(error, "Password Issue");
                        }
                      }
                    );
                    return;
                  }

                  joinAHiddenRoom(roomid);
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        id="confirm-box-topper"
        style={{
          display: "none",
          zIndex: 99999999,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: "100%",
          height: "100%",
          position: "fixed",
          background: "#000000"
        }}
      ></div>
      <div
        id="alert-box"
        className="modal fade"
        style={{ display: "none", zIndex: 999999999999999 }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="alert-title">
                Alert
              </h5>
              <button
                type="button"
                className="close btn-alert-close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div id="alert-message" className="model-list"></div>
            </div>

            <div className="modal-footer">
              <p id="alert-special"></p>
              <button className="btn btn-primary btn-alert-close">Close</button>
            </div>
          </div>
        </div>
      </div>

      <div
        id="confirm-box"
        className="modal fade"
        style={{ display: "none", zIndex: 999999999999999 }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="confirm-title">
                Please Confirm
              </h5>
              <button
                type="button"
                className="close btn-confirm-close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div id="confirm-message" className="modal-body"></div>

            <div className="modal-footer">
              <button className="btn btn-confirm-close" id="btn-confirm-close">
                Cancel
              </button>
              <button className="btn btn-primary" id="btn-confirm-action">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ minHeight: "400px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Room ID</th>
              <th>Owner ID</th>
              <th>Session</th>
              <th>Extra</th>
              <th>Participants</th>
              <th>Join</th>
            </tr>
          </thead>
          <tbody id="rooms-list">
            {roomList.map((room: any, idx: number) => {
              return (
                <tr id={room.sessionid}>
                  <td>
                    <span>{idx + 1}</span>
                    {room.isPasswordProtected ? (
                      <img
                        src="https://www.webrtc-experiment.com/images/password-protected.png"
                        style={{ height: "15px", verticalAlign: "middle" }}
                        title="Password Protected Room"
                      ></img>
                    ) : (
                      ""
                    )}
                  </td>
                  <td>
                    {" "}
                    <span className="max-width" id={room.sessionid}>
                      {" "}
                      {room.sessionid}
                    </span>{" "}
                  </td>
                  <td>
                    {" "}
                    <span className="max-width" id={room.owner}>
                      {" "}
                      {room.owner}
                    </span>{" "}
                  </td>
                  <td>
                    {Object.keys(room.session).map(key => {
                      return (
                        <pre>
                          <b> {key}</b> {room.session[key]}
                        </pre>
                      );
                    })
                    // 直播间的session信息
                    }
                  </td>
                  <td>
                    {room.participants.map((pid: string) => {
                      return (
                        <>
                          <span className="userinfo">
                            <span className="max-width" title={pid}>
                              {pid}
                            </span>
                          </span>
                          <br />
                        </>
                      );
                    })
                    // 直播间的参与者
                    }
                  </td>
                  {room.isRoomFull ? (
                    <td>
                      <span
                        style={{ borderBottom: "1px dotted red", color: "red" }}
                      >
                        Room is full
                      </span>
                    </td>
                  ) : (
                    <td>
                      <button
                        className="btn join-room"
                        data-roomid={room.sessionid}
                        data-password-protected={
                          room.isPasswordProtected ? "true" : "false"
                        }
                        onClick={e => {
                          const tr = document.getElementById(room.sessionid);
                          if (!tr) return;
                          $(tr)
                            .find(".join-room")
                            .prop("disabled", true);
                          const roomid = room.sessionid;
                          $("#txt-roomid-hidden").val(roomid);
                          $("#btn-show-join-hidden-room").click(); //这里可以优化
                          if (room.isPasswordProtected) {
                            $("#txt-room-password-hidden")
                              .parent()
                              .show();
                          } else {
                            $("#txt-room-password-hidden")
                              .parent()
                              .hide();
                          }
                          $(tr)
                            .find(".join-room")
                            .prop("disabled", false);
                        }}
                      >
                        Join
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer style={{ textAlign: "center" }}>
        Dashboard + Video Conferencing + Chat + File Sharing
      </footer>
    </div>
  );
};

export default DashBoard;
