import type { Disposition, HitPolicy, Rule } from '../domain/types';

/** What each Hit Policy does, in one line: the tooltip of every policy plate and the title block's note. */
export const HIT_POLICY_NOTE: Record<HitPolicy, string> = {
  FIRST: 'Rule match đầu tiên quyết định',
  UNIQUE: 'Tối đa một Rule được match',
  PRIORITY: 'Rule match có weight cao nhất thắng',
  COLLECT: 'Mọi Rule match, giữ thứ tự Rule',
};

/** The Hit Policy's name as an outlined plate, one style wherever a policy is named; its meaning is the tooltip. */
export function PolicyPlate({ policy }: { policy: HitPolicy }) {
  return (
    <span className="policy-plate" title={HIT_POLICY_NOTE[policy]}>
      {policy}
    </span>
  );
}

/** How a Rule plate reads: the role word, and whether the Rule decided, was set aside, or broke the policy. */
export type RuleTone = 'won' | 'lost' | 'stop';

/**
 * The word for what a Hit Policy made of a matched Rule. A UNIQUE winner is the one MATCH, not a contest's winner.
 * `missed` has no plate: a Rule that did not match is not shown in a Hit Policy's account.
 */
export function ruleRole(disposition: Exclude<Disposition, 'missed'>, policy: HitPolicy): { word: string; tone: RuleTone } {
  switch (disposition) {
    case 'won':
      return { word: policy === 'UNIQUE' ? 'match' : 'thắng', tone: 'won' };
    case 'collected':
      return { word: 'góp', tone: 'won' };
    case 'shadowed':
      return { word: 'che', tone: 'lost' };
    case 'outweighed':
      return { word: 'bị vượt', tone: 'lost' };
    case 'conflict':
      return { word: 'xung đột', tone: 'stop' };
  }
}

/**
 * A Rule plate in two cells: what the Hit Policy made of the Rule, written out (THẮNG, MATCH, CHE, BỊ VƯỢT, XUNG ĐỘT, GÓP),
 * then the Rule's id. The role is words, not only a colour or a dashed frame, so a screenshot reads on its own.
 * `setAside` dims a collected Rule whose line nobody asked for.
 */
export function RulePlate(props: {
  id: string;
  rule?: Rule;
  disposition: Exclude<Disposition, 'missed'>;
  policy: HitPolicy;
  setAside?: boolean;
}) {
  const { word, tone } = ruleRole(props.disposition, props.policy);
  return (
    <span className={`rule-plate is-${props.setAside ? 'lost' : tone}`} title={props.rule?.description}>
      <span className="rule-plate__role">{word}</span>
      <span className="rule-plate__id">{props.id}</span>
    </span>
  );
}
