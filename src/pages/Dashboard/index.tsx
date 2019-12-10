import React from 'react';
import {useState,useEffect,useCallback} from 'react'
import RTCMultiConnection from '../../dist/RTCMultiConnection.min'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap';
import 'socket.io'

const style = require('./index.css')
const publicRoomIdentifier = 'dashboard'
const DashBoard : React.FC = ()=>{
  
    const connection = useState(new RTCMultiConnection())


    return <div> 
    <header style={{marginBottom: '20px'}}>
    <span className="logo-text">Dashboard Example</span>

    <div style={{float: 'right', marginTop: '15px'}}>
      <button className="btn btn-primary" data-toggle="modal" data-target="#startRoomModel">Create A New Room</button>
      <button id="btn-show-join-hidden-room" className="top-span btn btn-secondary" data-toggle="modal" data-target="#joinRoomModel">Join A Room</button>
      <span className="top-span">Active rooms: <span id="active-rooms">0</span></span>
    </div>
  </header>
   <div className="modal fade" id="startRoomModel" tabIndex={-1} role="dialog" aria-labelledby="startRoomModelLabel" aria-hidden="true"> 
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="startRoomModelLabel">Create A New Room</h5>
          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body" style={{ paddingBottom: 0}}>
          <form>
            <div className="form-group">
              <p>
                <label className="col-form-label">Enter Room ID:</label>
                <input type="text" className="form-control" id="txt-roomid"></input>
              </p>

              <p>
                <label  className="col-form-label">Enter Your Name:</label>
                <input type="text" className="form-control" id="txt-user-name"></input>
              </p>

              <p style={{display: 'none'}}>
                <label className="col-form-label">Enter Room Password:</label>
                <input type="text" className="form-control" id="txt-room-password"></input>
              </p>

              <a href="" style={{float: 'right', marginBottom: '10px' ,fontSize: '14px' }} onClick={()=>{}} >Show More Options</a>

              <p className="more-options" style={{ marginBottom: 0,display: 'none'}}>
                <label className="col-form-label"><input type="checkbox" id="chk-room-password"/> Set Room Password?</label>
              </p>

              <p className="more-options" style={{marginTop: 0, marginBottom: 0, display: 'none'}}>
                <label className="col-form-label"><input type="checkbox" id="chk-hidden-room"/> Hidden Room? (Hide from the list)</label>
              </p>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" data-dismiss="modal">Close</button>
          <button type="button" className="btn btn-primary" id="btn-create-room">Create</button>
        </div>
      </div>
    </div>
  </div>

  <div className="modal fade" id="joinRoomModel" tabIndex={-1} role="dialog" aria-labelledby="joinRoomModelLabel" aria-hidden="true">
    <div className="modal-dialog" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title" id="joinRoomModelLabel">Join A Room</h5>
          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <form>
            <div className="form-group">
              <p>
                <label  className="col-form-label">Enter Room ID:</label>
                <input type="text" className="form-control" id="txt-roomid-hidden"/>
              </p>

              <p>
                <label  className="col-form-label">Enter Your Name:</label>
                <input type="text" className="form-control" id="txt-user-name-hidden"/>
              </p>

              <p style={{display: 'none'}}>
                <label  className="col-form-label">Enter Room Password:</label>
                <input type="text" className="form-control" id="txt-room-password-hidden"/>
              </p>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" data-dismiss="modal">Close</button>
          <button type="button" className="btn btn-primary" id="btn-join-hidden-room">Join</button>
        </div>
      </div>
    </div>
  </div>

  <div id="confirm-box-topper" style={{display:'none',zIndex:99999999,top:0,left:0,bottom:0,right:0,width:'100%',height:'100%',position:'fixed',background:'#000000'}}></div>
  <div id="alert-box" className="modal fade" style={{display:'none',zIndex:999999999999999}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="alert-title">Alert</h5>
                        <button type="button" className="close btn-alert-close" data-dismiss="modal" aria-label="Close">
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

  <div id="confirm-box" className="modal fade" style={{display:'none',zIndex:999999999999999}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="confirm-title">Please Confirm</h5>
                        <button type="button" className="close btn-confirm-close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div id="confirm-message" className="modal-body"></div>

                    <div className="modal-footer">
                        <button className="btn btn-confirm-close" id="btn-confirm-close">Cancel</button>
                        <button className="btn btn-primary" id="btn-confirm-action">Confirm</button>
                    </div>
                </div>
            </div>
        </div>

  <div style={{ minHeight: '400px'}}>
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
      <tbody id="rooms-list"><tr><td colSpan={9}>No active room found for this demo.</td></tr></tbody>
    </table>
  </div>

    <footer style={{textAlign: 'center'}}>Dashboard + Video Conferencing + Chat + File Sharing</footer>
    </div>
       
}

export default DashBoard;