import React from "react";
// import ProgressBar from 'react-bootstrap/ProgressBar';
import { LoadingOutlined } from "@ant-design/icons";
import { Divider, Typography } from "antd";

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = React.useState({} as any);
  const { Title } = Typography;
  const imgUrl = (name: string) => `/images/pokemon/pseudosprites/${name}.png`;
  const shinyImgUrl = (name: string) =>
    `/images/pokemon/shinypseudosprites/${name}.png`;
  const dexUrl = (name: string) =>
    `http://turquoise.alteredorigin.net/pokemon/${name.toLocaleLowerCase()}/`;

  const fetchProfileData = React.useCallback(async () => {
    const response = await fetch(
      "http://localhost:3000/profile/160794840815239168"
    );
    const { data } = await response.json();
    setProfile(data);
  }, []);

  React.useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <div className="profile">
      {!profile?.username ? (
        <LoadingOutlined className="loadSpinner" />
      ) : (
        <Typography>
          <div className="container breadcrumb">
            <Title level={2}>
              {`Pokémon Turqoise / New Logora / ${profile.firstName} ${profile.lastName}`}
            </Title>
          </div>
          <div className="container">
            <div className="panel info">
              <div className="basicInfo component">
                <Title level={3}>Basic Info</Title>
                <Divider />
                <div className="componentBody">
                  <Title level={5}>
                    Name: {profile.firstName}{" "}
                    {profile.nickname ? "'" + profile.nickname + "' " : ""}
                    {profile.lastName}
                  </Title>
                  <Title level={5}>Age: {profile.age}</Title>
                  <Title level={5}>Gender: {profile.gender}</Title>
                  {/* <li>Self Intro: {profile.bio}</li> */}
                </div>
              </div>
              <div className="rivalInfo component">
                <Title level={3}>Rival Info</Title>
                <Divider />
                <div className="componentBody">
                  <Title level={5}>
                    Name: {profile.rival.firstName} {profile.rival.lastName}
                  </Title>
                  <Title level={5}>Age: {profile.rival.age}</Title>
                  <Title level={5}>Gender: {profile.rival.gender}</Title>
                  <Title level={5}>Party:</Title>
                  {profile.rival.team.map((name: any, index: number) => (
                    <img key={index} src={imgUrl(name)} alt={name} />
                  ))}
                </div>
              </div>
            </div>
            <div className="panel belongings">
              <div className="inventory component">
                <Title level={3}>Inventory</Title>
                <Divider />
                <div className="componentBody">
                  <Title level={5}>Money: {profile.money}P</Title>
                  <Title level={5}>
                    Badges: {profile.badges.join(", ") || "None"}
                  </Title>
                  <Title level={5}>
                    Key Items: {profile.keyItems.join(", ") || "None"}
                  </Title>
                  <Title level={5}>General Items</Title>
                  <ul>
                    {profile.generalItems.map((item: any) => (
                      <li
                        key={item.name}
                      >{`${item.name} (x${item.quantity})`}</li>
                    ))}
                  </ul>
                  <Title level={5}>Pokeballs</Title>
                  <ul>
                    {profile.inventory.pokeBalls.map((item: any) => (
                      <li
                        key={item.name}
                      >{`${item.name} (x${item.quantity})`}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="party component">
                <Title level={3}>Party</Title>
                <Divider />
                <div className="componentBody">
                  <ul className="slotList">
                    {profile.party.map((pkmn: any, index: number) => (
                      <li key={pkmn.species}>
                        <Title level={4}>Slot {index + 1}:</Title>
                        {pkmn.pokemon && (
                          <ul>
                            Lv.{pkmn.level}{" "}
                            <span className={`gender gender-${pkmn.gender}`}>
                              {pkmn.gender === "M"
                                ? "♂"
                                : pkmn.gender === "F"
                                ? "♀"
                                : "X"}
                            </span>
                            <a href={dexUrl(pkmn.pokemon)}>
                              <img
                                alt={pkmn.species}
                                title={pkmn.pokemon}
                                src={
                                  pkmn.shiny
                                    ? shinyImgUrl(pkmn.species)
                                    : imgUrl(pkmn.species)
                                }
                              />
                            </a>
                            <li>
                              Name:{" "}
                              {pkmn.nickname ? pkmn.nickname : pkmn.pokemon}
                            </li>
                            <li>Ability: {pkmn.ability}</li>
                            <li>Nature: {pkmn.nature}</li>
                            <li>
                              Status:{" "}
                              <span className={`status ${pkmn.status}`}>
                                {pkmn.status || "None"}
                              </span>
                            </li>
                            <li>
                              HP: {pkmn.currentHP}/{pkmn.maxHP}
                              {/*<ProgressBar animated variant="danger" now={Math.floor(pkmn.currentHP/pkmn.maxHP*100)} className="Profile-progressBar" />*/}
                            </li>
                            <li>
                              EXP: {pkmn.exp.percentage}%
                              {/*<ProgressBar animated now={pkmn.exp.percentage} className="Profile-progressBar" />*/}
                            </li>
                            <li>
                              OT:{" "}
                              {pkmn.originalTrainer.firstName +
                                " " +
                                pkmn.originalTrainer.lastName +
                                " (" +
                                pkmn.originalTrainer.username +
                                ")"}
                            </li>
                            <li>All Moves: {pkmn.moves.join(", ")}</li>
                            <li>
                              Set Moves:
                              <table className="movesTable">
                                <tbody>
                                  {pkmn.setMoves.map(
                                    (move: any, index: number) => (
                                      <tr className="tableRow" key={move.name}>
                                        <td className="tableData">
                                          {index + 1}
                                        </td>
                                        <td className="tableData">
                                          {move.name}
                                        </td>
                                        <td className="tableData">
                                          {move.pp}/{move.maxPP} PP
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </li>
                          </ul>
                        )}
                        <Divider />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Typography>
      )}
    </div>
  );
};

export default ProfilePage;

// .loadContainer {
//   height: 100%;
//   display: flex;
//   align-items: center;
//   justify-content: center;

//   .loadSpinner {
//       font-size: 15em;
//       color: whitesmoke;
//   }
// }

// .profile {
//   border-radius: 10px;
//   height: 100%;

//   .ant-divider-horizontal {
//       margin-top: 6px;
//       margin-bottom: 6px;
//   }

//   .ant-typography {
//       color: whitesmoke;
//   }

//   article.ant-typography {
//       height: 100%;
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//       justify-content: flex-start;
//       align-content: flex-start;

//       .container.breadcrumb {
//           flex: 0 0 auto;
//       }

//       .container {
//           flex: 1 1 auto;
//           display: flex;
//           flex-direction: column;
//           justify-content: flex-start;
//           overflow: hidden;
//           align-content: flex-start;

//           .panel.info {
//               flex: 0 1 auto;
//           }

//           .panel.belongings {
//               flex: 1 2 auto;
//           }

//           .panel {
//               display: flex;
//               flex-direction: row;
//               justify-content: flex-start;
//               overflow: hidden;

//               .component {
//                   text-align: left;
//                   border-radius: 5px;
//                   overflow: hidden;

//                   .componentBody {
//                       overflow: auto;
//                   }
//               }

//               .basicInfo {
//                   display: flex;
//                   flex: 1;
//                   flex-direction: column;
//               }
//               .rivalInfo {
//                   display: flex;
//                   flex: 2;
//                   flex-direction: column;
//               }

//               .inventory {
//                   display: flex;
//                   flex: 1;
//                   flex-direction: column;
//                   color: whitesmoke;
//               }

//               .party {
//                   display: flex;
//                   flex: 2;
//                   flex-direction: column;
//                   text-align: left;
//                   border-radius: 10px;

//                   .movesTable {
//                       border: 1px solid black;
//                       border-collapse: collapse;
//                   }

//                   .tableRow .tableData {
//                       border: 1px solid black;
//                       padding-left: 5px;
//                       padding-right: 10px;
//                   }

//                   .progressBar {
//                       width: 50%;
//                   }

//                   .gender {
//                       font-size: 20px;
//                       text-shadow:
//                       -1px -1px 0 #000,
//                       0   -1px 0 #000,
//                       1px -1px 0 #000,
//                       1px  0   0 #000,
//                       1px  1px 0 #000,
//                       0    1px 0 #000,
//                       -1px  1px 0 #000,
//                       -1px  0   0 #000;
//                       padding-left: 3px;
//                       padding-right: 10px;
//                   }

//                   .gender-M {
//                       color: skyblue;
//                   }

//                   .gender-F {
//                       color: pink;
//                   }

//                   .gender-N {
//                       color: white;
//                       position: relative;
//                       top: 2px;
//                   }

//                   .status {
//                       border: 1px solid black;
//                       font-size: 80%;
//                       border-radius: 5px;
//                       padding-left: 5px;
//                       padding-right: 6px;
//                       padding-bottom: 1px;
//                   }

//                   .PRZ {
//                       border: 1px solid darkgoldenrod;
//                       color: darkgoldenrod;
//                       background-color: lightgoldenrodyellow;
//                   }

//                   .PSN {
//                       border: 1px solid purple;
//                       color: purple;
//                       background-color: plum;
//                   }

//                   .SLP {
//                       background-color: skyblue;
//                   }

//                   .BRN {
//                       border: 1px solid brown;
//                       color: brown;
//                       background-color: lightsalmon;
//                   }

//                   .FRZ {
//                       border: 1px solid darkcyan;
//                       color: darkcyan;
//                       background-color: lightblue
//                   }

//                   .FNT {
//                       background-color: red;
//                   }

//                   .slotList {
//                       padding-left: 0px;
//                   }
//               }
//           }
//       }
//   }

//   h5.ant-typography {
//       margin-top: 0;
//   }

//   ul,ul ul {
//       list-style-type: none;
//       padding-left: 15px;

//       li {
//           margin-left: 0px;
//           padding-left: 0px;
//       }
//   }
// }
