import { Avatar, Card } from "antd";
import { EditOutlined, ReadOutlined } from "@ant-design/icons";
import React from "react";

import { IServer } from "@/interfaces/models/server";
import Link from "next/link";
import DiscordIcon from "@/pages/components/assets/discordSvg";

interface ServerCardProps {
  server: IServer;
}

const { Meta } = Card;

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const avatarUrl: string = server.discovery.icon
    ? `https://cdn.discordapp.com/icons/${server.serverId}/${server.discovery.icon}.png`
    : "";

  return (
    <div className="m-2 w-full md:w-1/2 lg:w-1/3 md:max-w-[320px] lg:max-w-[293px] xl:max-w-[378px]">
      <Card
        className="
        bg-gray-300 border-gray-300 
        dark:bg-gray-1200 dark:border-gray-1200"
        actions={[
          <Link
            className="h-10 !w-4/5 min-w-[115px] max-w-[150px] space-x-2 !inline-flex flex-row justify-center items-center bg-gold-800 dark:bg-dgold-700 rounded-full"
            href={`/servers/${server.serverId}`}
          >
            <ReadOutlined
              key="read_more"
              style={{ fontSize: "20px" }}
              className="text-white dark:text-gray-1000"
            />
            <span className="text-white dark:text-gray-1000 font-bold">
              Discover
            </span>
          </Link>,
          <Link
            className="h-10 !w-4/5 min-w-[115px] max-w-[150px] space-x-2 !inline-flex flex-row justify-center items-center bg-[#5865F2] rounded-full"
            href={server.discovery.inviteLink ?? ""}
          >
            <DiscordIcon key="discord" />
            <span className="text-white font-bold">Join</span>
          </Link>,
        ]}
      >
        <Meta
          avatar={avatarUrl ? <Avatar src={avatarUrl} /> : undefined}
          title={server.name}
          description={server.discovery.description}
        />
      </Card>
    </div>
  );
};

export default ServerCard;
