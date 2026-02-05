import { HomePagePublic } from "../(public)/home/HomePagePublic";
import { HomePagePrivate } from "../(private)/home/HomePagePrivate";
import { SharedPage } from "./SharedPage";

export default function Page() {
  return (
    <SharedPage privatePage={HomePagePrivate} publicPage={HomePagePublic} />
  );
}
