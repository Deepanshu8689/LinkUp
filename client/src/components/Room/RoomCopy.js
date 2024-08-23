import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import socket from "../../socket";
import styled from "styled-components";
import VideoCard from "./VideoCard";
import BottomBar from "../BottomBar/BottomBar";
import Chat from "../Chat/Chat";
const RoomCopy = (props) => {
  const [peers, setPeers] = useState([]);
  const currentUser = sessionStorage.getItem("user");
  const roomId = props.match.params.roomId;
  const peersRef = useRef([]); //?
  const userVideoRef = useRef();
  const userStream = useRef();
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const screenTrackRef = useRef();

  useEffect(() => {
    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(filtered);
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Show the local video stream
        console.log(stream);
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit("BE-join-room", { roomId, userName: currentUser });
        socket.on("FE-user-join", (users) => {
          console.log("fe-user-call");
          const peers = [];
          users.forEach(({ userId, info }) => {
            let { userName, video, audio } = info;
            console.log(userName, video, audio);
            if (userName !== currentUser) {
              const peer = createPeer(userId, socket.id, stream); //connection call to other
              peer.userName = userName; // user2
              peer.peerID = userId; //user2

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              console.log(peer);
              peers.push(peer);

              setUserVideoAudio((prev) => {
                return {
                  ...prev,
                  [peer.userName]: { video, audio },
                };
              });
            }
          });
          setPeers(peers);
        });

        //user 2
        socket.on("FE-receive-call", ({ signal, from, info }) => {
          let { userName, video, audio } = info; //user1 info
          console.log(info);
          const peerIdx = findPeer(from);
          console.log("peerIDx ", peerIdx);
          //here from is user1
          if (!peerIdx) {
            const peer = addPeer(signal, from, stream); //signal is stream of user 1

            peer.userName = userName;
            console.log("username ", peer.userName);

            peersRef.current.push({
              peerID: from,
              peer,
              userName,
            });

            setPeers((users) => {
              return [...users, peer];
            });
            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });

        socket.on("FE-call-accepted", ({ signal, answerId }) => {
          const peerIdx = findPeer(answerId);
          console.log(peerIdx);
          if (peerIdx && peerIdx.peer) {
            // Added check here
            peerIdx.peer.signal(signal); // user1 adding user2 streams signals
          }
        });

        socket.on('FE-user-leave', ({ userId, userName }) => {
          const peerIdx = findPeer(userId);
        
          if (peerIdx && peerIdx.peer) { // Ensure peerIdx and peer exist
            peerIdx.peer.destroy(); // Destroy the peer connection
            
            setPeers((currentPeers) => {
              return currentPeers.filter((user) => user.peerID !== peerIdx.peer.peerID);
            });
        
            peersRef.current = peersRef.current.filter(({ peerID }) => peerID !== userId);
          } else {
            console.warn('Peer not found or already destroyed:', userId);
          }
        });
        

        socket.on('FE-toggle-camera', ({ userId, switchTarget }) => {
          const peerIdx = findPeer(userId);
    
          setUserVideoAudio((preList) => {
            let video = preList[peerIdx.userName].video;
            let audio = preList[peerIdx.userName].audio;
    
            if (switchTarget === 'video') video = !video;
            else audio = !audio;
    
            return {
              ...preList,
              [peerIdx.userName]: { video, audio },
            };
          });
        });
        return () => {
          socket.off("FE-user-join");
          socket.off("FE-receive-call");
          socket.off("FE-call-accepted");
          socket.off("FE-user-leave");
          socket.disconnect();
        };
      });
  }, [roomId, currentUser]);


  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  function createPeer(userId, caller, stream) {
    console.log("h1");
    const peer = new Peer({
      initiator: true, // Whether this peer should initiate the connection
      trickle: false,// Disable trickle ICE (for simplicity)
      stream,// The local stream to share
    });
    console.log("h2");
    // Handle the 'signal' event to send the signaling data to the other peer
    peer.on("signal", (signal) => {
      console.log("hello");
      socket.emit("BE-call-user", {
        userToCall: userId, //user2
        from: caller, //user1
        signal,
      });
    });

    peer.on("disconnect", () => {
      peer.destroy();
    });
    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    console.log("h3");
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,//user2 streams
    });
    console.log("h4");
    console.log("peer ", peer);
    peer.on("signal", (signal) => {
      socket.emit("BE-accept-call", { signal, to: callerId });
    });

    peer.signal(incomingSignal); //user2 adding user1 streams

    peer.on("disconnect", () => {
      peer.destroy();
    });

    return peer;
  }

  function createUserVideo(peer, index, arr) {
    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? "" : peers.length}`}
        // onClick={expandScreen}
        key={index}
      >
        {writeUserName(peer.userName)}
        <FaIcon className="fas fa-expand" />
        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  function writeUserName(userName, index) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }
  
  const clickChat=(e)=>{
    e.stopPropagation();  //This means that the event will not trigger any additional event listeners that are attached to parent elements of the target element.
    setDisplayChat(!displayChat)
  }

  const clickCameraDevice = (event) => {
    if (event && event.target && event.target.dataset && event.target.dataset.value) {
      const deviceId = event.target.dataset.value;
      const enabledAudio = userVideoRef.current.srcObject.getAudioTracks()[0].enabled;

      navigator.mediaDevices
        .getUserMedia({ video: { deviceId }, audio: enabledAudio })
        .then((stream) => {
          const newStreamTrack = stream.getTracks().find((track) => track.kind === 'video');
          const oldStreamTrack = userStream.current
            .getTracks()
            .find((track) => track.kind === 'video');

          userStream.current.removeTrack(oldStreamTrack);
          userStream.current.addTrack(newStreamTrack);

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              oldStreamTrack,
              newStreamTrack,
              userStream.current
            );
          });
        });
    }
  };

  const clickScreenSharing = () => {
    if (!screenShare) {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === 'video'),
              screenTrack,
              userStream.current
            );
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track) => track.kind === 'video'),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  
  const toggleCameraAudio = (e) => {
    const target = e.target.getAttribute('data-switch');

    setUserVideoAudio((preList) => {
      let videoSwitch = preList['localUser'].video;
      let audioSwitch = preList['localUser'].audio;

      if (target === 'video') {
        const userVideoTrack = userVideoRef.current.srcObject.getVideoTracks()[0];
        videoSwitch = !videoSwitch;
        userVideoTrack.enabled = videoSwitch;
      } else {
        const userAudioTrack = userVideoRef.current.srcObject.getAudioTracks()[0];
        audioSwitch = !audioSwitch;

        if (userAudioTrack) {
          userAudioTrack.enabled = audioSwitch;
        } else {
          userStream.current.getAudioTracks()[0].enabled = audioSwitch;
        }
      }

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit('BE-toggle-camera-audio', { roomId, switchTarget: target });
  };


  const goToBack = (e) => {
    e.preventDefault();
    socket.emit('BE-leave-room', { roomId, leaver: currentUser });
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <Container>
      {/* VideoAndBarContainer */}
      <VideoBar>
        <VideoContainer>
          <VideoBox
            className={`width-peer${peers.length > 8 ? "" : peers.length}`}
          >
            {userVideoAudio["localUser"].video ? null : (
              <UserName>{currentUser}</UserName>
            )}
            <FaIcon className="fas fa-expand" />
            <MyVideo ref={userVideoRef} muted autoPlay playInline></MyVideo>
          </VideoBox>
          <BottomBar
            clickScreenSharing={clickScreenSharing}
            clickChat={clickChat}
            clickCameraDevice={clickCameraDevice}
            goToBack={goToBack}
            toggleCameraAudio={toggleCameraAudio}
            userVideoAudio={userVideoAudio["localUser"]}
            screenShare={screenShare}
            videoDevices={videoDevices}
            showVideoDevices={showVideoDevices}
            setShowVideoDevices={setShowVideoDevices}
          />
          {peers &&
            peers.map((peer, index, arr) => createUserVideo(peer, index, arr))}
        </VideoContainer>
      </VideoBar>
      <Chat display={displayChat} roomId={roomId} />
    </Container>
  );
};

const MyVideo = styled.video``;

const Container = styled.div`
  display: flex;
  width: 100%;
  max-height: 100vh;
  flex-direction: row;
  border-right: 2px solid rgb(69, 69, 82, 0.25);
`;

const VideoBar = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  border-right: 2px solid rgb(69, 69, 82, 0.25);
`;

const VideoContainer = styled.div`
  max-width: 100%;
  height: 92%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  align-items: center;
  padding: 15px;
  box-sizing: border-box;
  gap: 10px;
`;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  > video {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  :hover {
    > i {
      display: block;
    }
  }
`;

const UserName = styled.div`
  color: #fff;
  position: absolute;
  font-size: calc(20px + 5vmin);
  z-index: 1;
`;
const FaIcon = styled.i`
  display: none;
  position: absolute;
  right: 15px;
  top: 15px;
`;

export default RoomCopy;
