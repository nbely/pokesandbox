import { Post } from "./Post";

export const Thread = () => {
  const temp_content =
    "Vivamus egestas auctor felis et lobortis. Nam dui sapien, pulvinar sed tempus mollis, consequat nec metus. Aenean volutpat metus sit amet neque tincidunt vulputate. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tincidunt vehicula vestibulum. Morbi egestas nibh sed tincidunt mattis. Suspendisse at eros convallis, venenatis leo maximus, condimentum nibh. Praesent efficitur non nisi at ultricies. Donec interdum ligula eu odio luctus, sit amet varius ante pulvinar. Nullam sed fermentum odio. Mauris at posuere arcu. Etiam venenatis quam et porttitor ullamcorper. Suspendisse eu nisl sem. Nunc dignissim magna a tempor sollicitudin. Ut eros elit, tincidunt vel massa nec, semper volutpat ex. Mauris tincidunt purus imperdiet accumsan pulvinar.";

  return (
    <div className="Thread">
      <div className="Thread-title">Thread Title</div>
      <Post title={"Post 1"} content={temp_content} />
      <Post title={"Post 2"} content={temp_content} />
      <Post title={"Post 3"} content={temp_content} />
    </div>
  );
};

// .Thread {
//   background-color: darkcyan;
//   display: flex;
//   flex-direction: column;
//   padding: 3px;
//   min-height: 400px;
//   width: 95%;
//   align-items: center;
// }

// .Thread-title {
//   background-color: darkslategray;
//   color: whitesmoke;
//   width: 100%;
//   height:30px;
// }
