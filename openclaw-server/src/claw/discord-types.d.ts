// Stub for discord.js types when the module isn't installed
declare module 'discord.js' {
  export class Client {
    constructor(options: any);
    on(event: string, handler: (...args: any[]) => void): void;
    login(token: string): Promise<void>;
    user: { tag: string } | null;
    channels: { fetch(id: string): Promise<any> };
  }
  export class EmbedBuilder {
    setTitle(title: string): this;
    setDescription(desc: string): this;
    setColor(color: number): this;
    setTimestamp(): this;
    addFields(...fields: { name: string; value: string; inline?: boolean }[]): this;
  }
  export class ActionRowBuilder<T = any> {
    addComponents(...components: any[]): this;
  }
  export class ButtonBuilder {
    setCustomId(id: string): this;
    setLabel(label: string): this;
    setStyle(style: any): this;
    setEmoji(emoji: string): this;
  }
  export const ButtonStyle: { Primary: number; Danger: number; Success: number; Secondary: number };
  export const GatewayIntentBits: { Guilds: number; GuildMessages: number; MessageContent: number };
}
