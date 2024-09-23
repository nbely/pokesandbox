"use client";
import { ReadOutlined } from "@ant-design/icons";
import { Avatar, Card } from "antd";
import Link from "next/link";

import type { ServerDTO } from "@shared";
import DiscordIcon from "@webapp/components/assets/discordSvg";

interface ServerCardProps {
  server: ServerDTO;
}

const ServerCard = ({ server }: ServerCardProps) => {
  const iconUrl: string = server.discovery.icon
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
            key="read_more"
          >
            <ReadOutlined
              style={{ fontSize: "20px" }}
              className="text-white dark:text-gray-1000"
            />
            <span className="text-white dark:text-gray-1000 font-bold">
              Discover
            </span>
          </Link>,
          <a
            className="h-10 !w-4/5 min-w-[115px] max-w-[150px] space-x-2 !inline-flex flex-row justify-center items-center bg-[#5865F2] rounded-full"
            href={server.discovery.inviteLink ?? ""}
            key="discord"
            rel="external noopener noreferrer"
            target="_blank"
          >
            <DiscordIcon />
            <span className="text-white font-bold">Join</span>
          </a>,
        ]}
      >
        <Card.Meta
          avatar={iconUrl ? <Avatar src={iconUrl} /> : undefined}
          title={server.name}
          description={server.discovery.description}
        />
      </Card>
    </div>
  );
};

export default ServerCard;
