import express from 'express';
import cors from 'cors';

import { PrismaClient } from '@prisma/client';
import { covertHourStringToMinutes } from './utils/convertHourStringToMinutes';
import { covertMinutesToHourString } from './utils/convertMinutesToHourString';

const app = express();

app.use(express.json());
app.use(cors());

const prisma = new PrismaClient({
  log: ['query'],
});

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return response.json({
    result: 'success',
    message: 'Success in listing games',
    data: games,
  });
});

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
      discord: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const data = ads.map((ad) => {
    return {
      ...ad,
      weekDays: ad.weekDays?.split(','),
      hourStart: covertMinutesToHourString(ad.hourStart),
      hourEnd: covertMinutesToHourString(ad.hourEnd),
    };
  });

  return response.json({
    result: 'success',
    message: 'Success in listing ads',
    data,
  });
});

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body = request.body;

  //Validations??

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays?.join(','),
      hourStart: covertHourStringToMinutes(body.hourStart),
      hourEnd: covertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    },
  });

  return response
    .status(201)
    .json({
      result: 'success',
      message: 'Success in create your ads',
      data: ad,
    });
});

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return response.json({
    result: 'success',
    message: 'Success in get discord',
    data: { discord: ad?.discord },
  });
});

app.listen(3333);
