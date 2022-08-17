import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { Context, Telegraf } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

interface ITrimAudioProps {
	bot?: Telegraf<Context<Update>>;
	ctx: Context<{
		message: Update.New & Update.NonChannel & Message.AudioMessage;
		update_id: number;
	}> &
		Omit<Context<Update>, keyof Context<Update>>;
	options: {
		startTime: number;
		endTime: number;
	};
}

export const trimAudio = async ({
	bot,
	ctx,
	options: {startTime, endTime},
}: ITrimAudioProps) => {
	const fileId = ctx.message.audio.file_id;
	const {file_path, file_unique_id} = await ctx.telegram.getFile(fileId);

	const audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`;

	const {data} = await axios({
		method: 'get',
		url: audioUrl,
		responseType: 'arraybuffer',
	});
	fs.writeFileSync(`${file_unique_id}.mp3`, data);

	await new Promise((resolve, reject) => {
		ffmpeg(`${file_unique_id}.mp3`)
			.setStartTime(+startTime)
			.setDuration(+endTime - +startTime)
			.save(`${file_unique_id}-trimmed.mp3`)
			.on('start', function (commandLine) {
				console.log('start : ' + commandLine);
			})
			.on('progress', function (progress) {
				console.log('In Progress !!' + Date());
			})
			.on('end', function () {
				return resolve(`${file_unique_id}-trimmed.mp3`);
			})
			.on('error', function (err) {
				console.log('reject');
				return reject(err);
			});
	});

	setTimeout(async () => {
		await new Promise((resolve, reject) => {
			resolve(ctx.replyWithAudio({source: `${file_unique_id}-trimmed.mp3`}));
		});
		fs.rmSync(`${file_unique_id}.mp3`);
		fs.rmSync(`${file_unique_id}-trimmed.mp3`);
	}, 1000);
};
