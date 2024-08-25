import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import socket from "../../socket";
const MainCopy = (props) => {
  const roomRef = useRef();
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const handleUserExistError = ({ error }) => {
      if (!error) {
        const userName = userRef?.current?.value;
        const roomName = roomRef?.current?.value;

        if (userName && roomName) {
          sessionStorage.setItem("user", userName);
          props.history.push(`/room/${roomName}`);
          console.log(userName, roomName);
        }
      } else {
        setErr(error);
        setErrMsg("User name already exists");
      }
    };

    socket.on("FE-error-user-exist", handleUserExistError);

    return () => {
      socket.off("FE-error-user-exist", handleUserExistError);
    };
  }, [props.history]);

  const handleJoin = () => {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!userName || !roomName) {
      setErr(true);
      setErrMsg("All fields are Necessary");
    } else {
      socket.emit("BE-check-user", { roomId: roomName, userName });
    }
  };
  return (
    <BackgroundImageContainer>
      <DIV>
        <Container>
          <Row>
            <Label htmlFor="userName">Name</Label>
            <Input type="text" id="userName" ref={userRef} />
          </Row>
          <Row>
            <Label htmlFor="roomName">Room Id</Label>
            <Input type="text" ref={roomRef} id="roomName" />
          </Row>
          <JoinButton onClick={handleJoin}>Join</JoinButton>
          {err ? <Error>{errMsg}</Error> : null}
        </Container>
      </DIV>
    </BackgroundImageContainer>
  );
};

export default MainCopy;
const BackgroundImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;  /* Center the content vertically and horizontally */
  min-height: 100vh;  /* Ensures the container takes up the full height of the viewport */
  width: 100%;
  background-image: url("https://images.pexels.com/photos/583847/pexels-photo-583847.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  ::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5); /* Adjust the opacity to control the fade effect */
    z-index: 1;
  }
`;

// const BackgroundImageContainer = styled.div`
//   display: flex;
//   justify-content: center;
//   height: 100%;
//   width: 100%;
//   background-image: url("https://cdn.dribbble.com/users/2563862/screenshots/6141448/untitled-7_4x.png");
//   background-size: cover; /* or 'contain' */
//   background-position: center;
//   background-repeat: no-repeat;
// `;

const DIV = styled.div`
  // height: 200px;
  // width: 300px;
  // padding: 50px;
  // border-radius: 15px;
  // background: #fff;
  // box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 2; /* Ensure the content is above the overlay */
  height: 170px;
  width: 300px;
  padding: 50px;
  border-radius: 15px;
  background: #FFF8F3;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 15px;
  line-height: 35px;
`;
const Label = styled.label`
  font-weight: bold;
`;

const Input = styled.input`
  width: 150px;
  height: 30px;
  margin-left: 15px;
  padding-left: 10px;
  border: 2px solid black;
  border-radius: 5px;
  padding: 2px;
`;

const JoinButton = styled.button`
  border: 0;
  font: bold;
  height: 40px;
  outline: none;
  color: #fff;
  cursor: pointer;
  transition: 0.3s;
  border-radius: 3px;
  background: #8c7569;
  /* padding: 1.2rem 3.2rem; */
  text-transform: uppercase;
  font-family: "Nunito", sans-serif;
  margin-top: 20px;
  font-size: 16px;
  font-weight: bold;

  &:hover {
    background: #55311c;
  }
`;

const Error = styled.div`
  margin-top: 10px;
  font-size: 20px;
  color: #e85a71;
`;
