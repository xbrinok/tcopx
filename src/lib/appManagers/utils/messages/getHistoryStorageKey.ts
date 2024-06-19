import type {Reaction} from '../../../../layer';
import type {HistoryStorage, RequestHistoryOptions, SearchStorageFilterKey} from '../../appMessagesManager';

export default function getHistoryStorageKey(options: RequestHistoryOptions & {type: HistoryStorage['type']}) {
  const {type, peerId, threadId} = options;
  const filter = getSearchStorageFilterKey(options);
  return [type, peerId, filter, threadId].filter(Boolean).join('_') as HistoryStorage['key'];
}

export function getSearchStorageFilterKey({
  inputFilter,
  savedReaction,
  query
}: Parameters<typeof getHistoryStorageKey>[0]): SearchStorageFilterKey {
  let reactionsPart: string;
  if(savedReaction) {
    const part = savedReaction.map((reaction) => {
      return (reaction as Reaction.reactionCustomEmoji).document_id || (reaction as Reaction.reactionEmoji).emoticon;
    }).join(',');
    reactionsPart = `tag-${part}`;
    inputFilter ??= {_: 'inputMessagesFilterEmpty'};
  }

  const filter: SearchStorageFilterKey = inputFilter?._;
  return [filter, query, reactionsPart].filter(Boolean).join('_');
}
