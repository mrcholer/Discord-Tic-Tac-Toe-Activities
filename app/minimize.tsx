import { Minimize } from "ludicord";
import type { MinimizeProps } from "ludicord";
import { useDiscord, useDiscordChannel, useDiscordUser } from "ludicord/discord";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

export default function MinimizeCard({
    heading = "Ludicord Activity",
    message = "Choose Game to challenge another player in Tic-Tac-Toe.",
    author = "Ludicord",
    channelName = "this channel",
    timestamp = "Now",
    avatar,
}: MinimizeProps) {
    const discord = useDiscord();
    const channel = useDiscordChannel();
    const user = useDiscordUser();
    const guest = discord.status === "outside-discord";
    const resolvedAuthor = author === "CatiBot"
        ? (guest ? "Guest User" : (user?.displayName ?? author))
        : author;
    const resolvedChannel = channelName === "this channel"
        ? (guest ? "browser" : (channel?.name ?? channelName))
        : channelName;

    return (
        <Minimize card={false}>
            <div
                className="frontend-minimize-card h-[136px] w-[min(360px,calc(100vw-32px))] cursor-pointer overflow-hidden rounded-lg border-[3px] border-[#4a2e1a] text-[#F1ECDD]"
                style={{
                    boxShadow: "inset 0 0 0 2px #6b4226, 0 6px 14px rgba(0,0,0,0.4)",
                    background:
                        "radial-gradient(circle at 25% 15%, rgba(241,236,221,0.05), transparent 45%), linear-gradient(160deg, #1a352c 0%, #12251f 100%)",
                }}
            >
                <div
                    className="flex min-h-[40px] items-center justify-between gap-3 border-b border-[#F1ECDD]/15 px-3.5 py-2.5 text-[14px] text-[#F1ECDD]/85"
                    style={{ fontFamily: chalkFont }}
                >
                    <span>{heading}</span>
                    <span className="max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-[#F1ECDD]/[0.08] px-2 py-0.5 font-sans text-[11px] text-[#F1ECDD]/55">
                        # {resolvedChannel}
                    </span>
                </div>
                <div className="flex min-h-[88px] gap-3 overflow-hidden px-3.5 py-3">
                    {avatar ? (
                        <img
                            alt=""
                            className="h-8 w-8 flex-none rounded-full border-2 border-[#F4C860]/50 object-cover"
                            src={avatar}
                        />
                    ) : (
                        <span
                            className="grid h-8 w-8 flex-none place-items-center rounded-full border-2 border-[#F4C860]/50 bg-[#F4C860]/15 text-[15px] text-[#F4C860]"
                            style={{ fontFamily: chalkFont }}
                        >
                            {resolvedAuthor.slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                            <strong className="text-[15px] font-normal" style={{ fontFamily: chalkFont }}>
                                {resolvedAuthor}
                            </strong>
                            <span className="text-[11px] text-[#F1ECDD]/40">{timestamp}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-[#F1ECDD]/65">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        </Minimize>
    );
}