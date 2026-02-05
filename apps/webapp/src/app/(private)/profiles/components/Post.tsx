import Image from "next/image";

type PostProps = {
  content: string;
  title: string;
};

export const Post = ({ title, content }: PostProps) => {
  const url = "https://i1.sndcdn.com/avatars-000651700224-nysi7a-t500x500.jpg";

  return (
    <div className="Post">
      <div className="Post-title">{title}</div>
      <div className="Post-user">
        <Image
          className="Post-avatar"
          src={url}
          alt="User Avatar"
          width={80}
          height={80}
        />
        <div className="Post-username">
          <div>{"Lord Dalmonde"}</div>
          <div>{"Taav#4683"}</div>
        </div>
      </div>
      <div className="Post-content">{content}</div>
    </div>
  );
};

// .Post {
//   background-color: turquoise;
//   display: flex;
//   flex-direction: column;
//   border-radius: 10px;
//   padding: 3px;
//   width: 90%;
//   min-height: 200px;
//   margin: 4px;
// }

// .Post-title {
//   background-color: darkslategray;
//   color: whitesmoke;
//   text-align: left;
//   padding: 10px;
//   border-radius: 10px 40px 0px 0px;
// }

// .Post-user {
//   text-align: left;
//   color: purple;
//   display: flex;
//   flex-direction: row;
//   align-items: center;
//   padding: 10px;
//   background-color: whitesmoke;
// }

// .Post-username {
//   margin-left: 20px;

// }

// .Post-avatar {
//   border-radius: 100px;
//   background-color: black;
//   width: 80px;
// }

// .Post-content {
//   padding: 20px;
// }
