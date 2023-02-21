import { QueueDocument } from 'model/document';
import emptyUrl from 'assets/templates/empty.que';
import animatedTextUrl from 'assets/templates/animated-text.que';
import playUrl from 'assets/templates/play.que';

export interface TemplateMeta {
  name: string;
  preview: string;
  getTemplate(): Promise<QueueDocument>;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    name: 'Empty',
    preview: '',
    getTemplate: () => fetch(emptyUrl).then((r) => r.json()),
  },
  {
    name: 'Animated Text',
    preview: '',
    getTemplate: () => fetch(animatedTextUrl).then((r) => r.json()),
  },
  {
    name: 'Play',
    preview: '',
    getTemplate: () => fetch(playUrl).then((r) => r.json()),
  },
];
