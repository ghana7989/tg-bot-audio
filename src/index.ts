import { Telegraf } from 'telegraf';

import { trimAudio } from './services/trimAudio';

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN as string);

const map = {
	startTime: 0,
	endTime: 30,
};
const messageId = {} as {
	[key: string]: number;
};
// commands
bot.command('trim', async ctx => {
	const ques1ID = (await ctx.reply('Enter start time')).message_id;
	messageId['ques1ID'] = ques1ID;
});

bot.on('text', async ctx => {
	if (ctx.message.reply_to_message?.message_id === messageId['ques1ID']) {
		map.startTime = +ctx.message.text;
		const ques2ID = await (await ctx.reply('Enter end time')).message_id;
		messageId['ques2ID'] = ques2ID;
	} else if (
		ctx.message.reply_to_message?.message_id === messageId['ques2ID']
	) {
		map.endTime = +ctx.message.text;
		ctx.reply('Now send the audio');
	}
});

bot.on('audio', async ctx => {
	ctx.reply(
		`If not given start and end time, I will be trimming the audio from ${0} to ${30} seconds`,
		{disable_notification: true},
	);
	await trimAudio({ctx, options: map, bot});
});

bot
	.launch()
	.then(() => {
		console.log('Bot started');
	})
	.catch(err => {});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
