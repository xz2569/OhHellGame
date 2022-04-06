import { Table, Button } from "react-bootstrap";

const ScoreTable = ({ playersInfo, showDetail }) => {
  if (playersInfo.length === 0) {
    return <></>;
  }

  return (
    <div>
      <Table
        style={{ fontSize: "20px", fontFamily: "Ubuntu, sans-serif" }}
        responsive
        size="sm"
        borderless
      >
        <thead>
          <tr style={{ borderBottom: "solid 2px black" }}>
            <th style={{ borderRight: "solid 2px black" }}>Player </th>
            <th>Total Score </th>
          </tr>
        </thead>
        <tbody>
          {playersInfo.map((playerInfo) => (
            <tr key={playerInfo.username}>
              <td style={{ borderRight: "solid 2px black" }}>
                {playerInfo.username}
              </td>
              <td>{playerInfo.score}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="link" onClick={showDetail}>
        see details
      </Button>
    </div>
  );
};

export default ScoreTable;
