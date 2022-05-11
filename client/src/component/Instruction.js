import { Modal, ListGroup } from "react-bootstrap";
import { BsArrowDownUp, BsArrowDown, BsArrowUp } from "react-icons/bs";

const Instruction = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "Palette Mosaic, cursive" }}>
          How to Play
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>The big picture</h4>
        <p>
          The game consists of multiple <u>rounds</u> (aka <u>hands</u>). In the
          following, we first describe the steps of each round, then show how
          rounds evolve throughout the game.
        </p>
        <h4>Process of each round</h4>
        <ListGroup as="ol" numbered>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">dealing the cards</div>
              equal amount of card is dealt to each player after the deck is
              fully shuffled
            </div>
          </ListGroup.Item>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">setting the trump</div>
              the top card of the remainning deck determines the{" "}
              <span style={{ color: "blue" }}>trump suit</span>
            </div>
          </ListGroup.Item>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">guessing the outcome</div>
              each player says the number of tricks they believe they will
              take/win in the round.
              <div style={{ color: "darkgray" }}>
                Note: the total number of tricks guessed cannot equal the total
                number of tricks for the round.
              </div>
            </div>
          </ListGroup.Item>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">playing the tricks</div>
              for each trick
              <ListGroup as="ol" numbered>
                <ListGroup.Item
                  as="li"
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">setting the suit</div>
                    the leading player -- the one with a crown next to the name
                    -- plays a card, which determines the{" "}
                    <span style={{ color: "blue" }}>suit of the trick</span>.
                    <div style={{ color: "darkgray" }}>
                      Note: the leading player of the first trick goes in a
                      round robin fashion from round to round; the leading
                      player of subsequent tricks is the winner of the previous
                      trick.
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item
                  as="li"
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">continuing the trick</div>
                    each subsequent player plays a card, following the suit set
                    by the leading player.{" "}
                    <div style={{ color: "darkgray" }}>
                      Note: only when the player runs out of this particular
                      suit can they play a different suit.
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item
                  as="li"
                  className="d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">determining the winner</div>
                    the player who playes the highest value card takes the trick
                    where cards of the trump suit automatically beat cards of
                    any other suit.
                    <div style={{ color: "darkgray" }}>
                      Note: 2 is the lowest, and A is the highest.
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </div>
          </ListGroup.Item>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">calculating the scores</div>
              if the player wins the same number of tricks as they guessed, they
              gain 10 points for each bet plus an additional 10 points;
              otherwise, they lose 10 points for each difference.
            </div>
          </ListGroup.Item>
        </ListGroup>
        <p></p>
        <h4>
          All the rounds <BsArrowDownUp />
        </h4>
        <ListGroup as="ol" numbered>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">Round #1</div>
              Each player is dealt with 8 cards by default, if the total number
              of players allows so.
              <div style={{ color: "darkgray" }}>
                Note: this is customizable during the waiting room phase.
              </div>
            </div>
          </ListGroup.Item>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">
                Subsequent rounds <BsArrowDown />{" "}
              </div>
              Each subsequent round has one{" "}
              <span style={{ color: "blue" }}>fewer</span> cards than the
              previous round until we reach the two special rounds with only one
              card.
            </div>
          </ListGroup.Item>
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">Special rounds with one card</div>
              For both special rounds, players cannot see their own hand but can
              see all others' cards. These two rounds differ by whether a trump
              suit is set or not.
            </div>
          </ListGroup.Item>{" "}
          <ListGroup.Item
            as="li"
            className="d-flex justify-content-between align-items-start"
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">
                Subsequent rounds <BsArrowUp />
              </div>
              Each subsequent round has one{" "}
              <span style={{ color: "blue" }}>more</span> card than the previous
              round, until the number of rounds goes all the way back to the
              first round of the game.
            </div>
          </ListGroup.Item>
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
};

export default Instruction;
