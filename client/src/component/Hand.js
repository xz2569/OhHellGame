import { Card, CardGroup } from "react-bootstrap";

const Hand = ({ cards, myTurn, onClick, currentSuit }) => {
  var outOfCurrentSuit;
  if (cards.length > 0) {
    outOfCurrentSuit =
      cards.map((card) => card[card.length - 1]).indexOf(currentSuit) === -1;
  }
  return (
    <div>
      <CardGroup
        className={"d-flex"}
        style={{ maxHeight: "175px", margin: "auto" }}
      >
        {cards.map((card, index) => (
          <Card
            key={card}
            border="light"
            className={`${index === 0 ? "card-first" : "card-middle"} ${
              index === cards.length - 1 ? "card-last" : "card-middle"
            }`}
            style={{ padding: "5px", maxWidth: "115px" }}
          >
            <Card.Img
              style={{
                maxHeight: "150px",
                opacity: `${
                  myTurn &&
                  (outOfCurrentSuit || card[card.length - 1] === currentSuit)
                    ? "1"
                    : "0.5"
                }`,
              }}
              id={card}
              onClick={
                myTurn &&
                (outOfCurrentSuit || card[card.length - 1] === currentSuit)
                  ? onClick
                  : () => {}
              }
              onMouseEnter={
                myTurn &&
                (outOfCurrentSuit || card[card.length - 1] === currentSuit)
                  ? (e) => {
                      e.target.style.boxShadow = "0px 0px 15px black";
                    }
                  : () => {}
              }
              onMouseLeave={
                myTurn
                  ? (e) => {
                      e.target.style.boxShadow = "0px 0px 0px";
                    }
                  : () => {}
              }
              rel="preload"
              src={`cards/${card}.svg`}
            />
          </Card>
        ))}
      </CardGroup>
    </div>
  );
};

export default Hand;
