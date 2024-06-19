/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import {splitProps, createEffect, createSignal, For, JSX, createMemo, onCleanup, untrack, createComputed, createReaction} from 'solid-js';
import {createStoriesViewer} from './viewer';
import {Document, MessageMedia, Photo, StoryItem} from '../../layer';
import {wrapStoryMedia} from './preview';
import getMediaThumbIfNeeded from '../../helpers/getStrippedThumbIfNeeded';
import {SearchSelection} from '../chat/selection';
import {StoriesProvider, useStories} from './store';

const TEST_ONE = false;
const TEST_TWO = false;

function _StoriesProfileList(props: {
  onReady?: () => void,
  onLengthChange?: (length: number) => void,
  selection?: SearchSelection
}) {
  const [stories, actions] = useStories();
  const [list, setList] = createSignal<JSX.Element>();
  const [length, setLength] = createSignal(0);
  const [viewerId, setViewerId] = createSignal<number>();
  const items = new Map<number, HTMLElement>();

  const onReady = () => {
    const list = <For each={stories.peer.stories}>{Item}</For>;

    createEffect(() => {
      const elements: JSX.Element[] = (list as any)();
      if(TEST_ONE) elements.length = 1;
      else if(TEST_TWO) elements.length = 2;
      const length = elements.length;
      setLength(length);
      setList(elements);
      props.onLengthChange?.(length);
    });

    props.onLengthChange && createEffect(() => {
      props.onLengthChange(stories.peer?.count);
    });

    props.onReady?.();
  };

  createReaction(onReady)(() => stories.ready);

  createEffect(() => {
    const id = viewerId();
    if(!id) {
      return;
    }

    const onExit = () => {
      setViewerId(undefined);
    };

    const target = createMemo(() => {
      const storyId = stories.peer.stories[stories.peer.index].id;
      return items.get(storyId);
    });

    untrack(() => {
      const peer = stories.peer;
      const index = peer.stories.findIndex((story) => story.id === id);
      actions.set({peer, index});
    });

    createStoriesViewer({
      onExit,
      target,
      splitByDays: true
    });
  });

  const Item = (storyItem: StoryItem) => {
    const {container, div, media, thumb} = wrapStoryMedia({
      peerId: stories.peer.peerId,
      storyItem: storyItem as StoryItem.storyItem,
      forPreview: true,
      noAspecter: true,
      containerProps: {
        // @ts-ignore
        'data-mid': storyItem.id,
        'data-peer-id': stories.peer.peerId,
        'class': 'grid-item search-super-item',
        'onClick': (e) => {
          setViewerId(storyItem.id);
        }
      },
      childrenClassName: 'grid-item-media',
      noPlayButton: true
    });

    createEffect(() => {
      const t = thumb();
      const m = media();
      const element = m || t;
      if(!element) {
        return;
      }

      items.set(storyItem.id, element);
      onCleanup(() => {
        items.delete(storyItem.id);
      });

      if(length() === 1) {
        const messageMedia = (storyItem as StoryItem.storyItem).media;
        const media = (messageMedia as MessageMedia.messageMediaPhoto).photo as Photo.photo || (messageMedia as MessageMedia.messageMediaDocument).document as Document.document;
        const gotThumb = getMediaThumbIfNeeded({
          photo: media,
          cacheContext: {type: 'x', url: '', downloaded: 0},
          useBlur: true,
          ignoreCache: true,
          onlyStripped: true
        });
        const thumb = gotThumb.image;
        element.parentElement.prepend(thumb);

        onCleanup(() => {
          thumb.remove();
        });
      }
    });

    if(props.selection?.isSelecting) {
      props.selection.toggleElementCheckbox(div, true);
    }

    return container;
  };

  return (
    <div
      class="grid"
      classList={{two: length() === 2, one: length() === 1}}
    >
      {list()}
    </div>
  );
}

export default function StoriesProfileList(props: Parameters<typeof StoriesProvider>[0] & Parameters<typeof _StoriesProfileList>[0]) {
  const [, rest] = splitProps(props, ['onReady', 'onLengthChange', 'selection']);
  return (
    <StoriesProvider {...rest}>
      <_StoriesProfileList {...props} />
    </StoriesProvider>
  );
}
