import { Alert } from "react-bootstrap";

const Message = ({ message }) => {
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <Alert style={{ backgroundColor: "#212529", color: "white" }}>
      <h5 style={{ fontFamily: "Ubuntu, sans-serif", margin: "0px" }}>
        {capitalizeFirstLetter(message)}
      </h5>
    </Alert>
  );
};

export default Message;
