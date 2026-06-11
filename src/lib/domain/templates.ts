import { createStory, createScene } from './story';
import type { Story } from './story';

export interface TemplateScene {
	title: string;
	summary: string;
}

export interface TemplateAct {
	title: string;
	scenes: TemplateScene[];
}

export interface StoryTemplate {
	id: string;
	name: string;
	description: string;
	/** Short visual marker — an SVG path or emoji */
	icon: string;
	acts: TemplateAct[];
	/** Optional pre-written character suggestions */
	characters?: { name: string; role: string }[];
}

const templates: StoryTemplate[] = [
	{
		id: 'blank',
		name: 'Blank',
		description: 'A single act with one scene. No structure, no constraints.',
		icon: 'M4 6h16M4 12h16M4 18h16',
		acts: [
			{
				title: 'Act I',
				scenes: [{ title: 'New Scene', summary: '' }],
			},
		],
	},
	{
		id: 'three-act',
		name: 'Three-Act',
		description: 'The classic dramatic arc: Setup, Confrontation, Resolution.',
		icon: 'M3 3v18M9 3v18M15 3v18M21 3v18',
		acts: [
			{
				title: 'Act I — Setup',
				scenes: [
					{ title: 'The Ordinary World', summary: 'The protagonist in their familiar life before change arrives.' },
					{ title: 'The Inciting Incident', summary: 'An event disrupts the status quo and presents a challenge.' },
					{ title: 'The Choice', summary: 'The protagonist faces a decision: stay safe or step forward.' },
					{ title: 'The Mentor Appears', summary: 'A guide offers wisdom, tools, or a push in the right direction.' },
					{ title: 'Crossing the Threshold', summary: 'The protagonist commits and leaves the familiar behind.' },
					{ title: 'Early Tests', summary: 'First challenges reveal strengths, weaknesses, and who to trust.' },
					{ title: 'The New World', summary: 'The protagonist begins to adapt to an unfamiliar situation.' },
					{ title: 'The Hook', summary: 'The stakes sharpen; the audience is pulled into Act II.' },
				],
			},
			{
				title: 'Act II — Confrontation',
				scenes: [
					{ title: 'Rising Stakes', summary: 'The cost of failure becomes clear and personal.' },
					{ title: 'Allies and Enemies', summary: 'New relationships form; true loyalties are tested.' },
					{ title: 'The Subplot', summary: 'A secondary story deepens character and theme.' },
					{ title: 'Midpoint', summary: 'A major revelation or reversal changes everything.' },
					{ title: 'Setbacks', summary: 'Plans unravel; the protagonist regroups.' },
					{ title: 'Darkest Moment', summary: 'The protagonist hits rock bottom — emotionally or physically.' },
					{ title: 'The Inner Struggle', summary: 'The protagonist confronts their deepest flaw.' },
					{ title: 'The Turning Point', summary: 'A new insight or discovery reignites hope.' },
				],
			},
			{
				title: 'Act III — Resolution',
				scenes: [
					{ title: 'The Final Push', summary: 'The protagonist prepares for the ultimate confrontation.' },
					{ title: 'Gathering Forces', summary: 'Allies assemble. The final plan takes shape.' },
					{ title: 'The Calm Before', summary: 'A quiet moment of reflection before the storm.' },
					{ title: 'The Climax Begins', summary: 'The final confrontation starts — action or decision.' },
					{ title: 'The Ordeal', summary: 'The protagonist faces their greatest test.' },
					{ title: 'The Revelation', summary: 'A final truth is uncovered, changing how we see the story.' },
					{ title: 'The Resolution', summary: 'The central conflict ends. A new order emerges.' },
					{ title: 'The Return Home', summary: 'The protagonist integrates their growth into a changed life.' },
				],
			},
		],
	},
	{
		id: 'heros-journey',
		name: "Hero's Journey",
		description: 'Monomyth in 12 stages — from the ordinary world to the return with the elixir.',
		icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
		acts: [
			{
				title: 'The Journey',
				scenes: [
					{ title: 'Ordinary World', summary: 'The hero\'s familiar life before the adventure begins.' },
					{ title: 'Call to Adventure', summary: 'A challenge, quest, or disruption is presented.' },
					{ title: 'Refusal of the Call', summary: 'The hero hesitates — fear, duty, or doubt holds them back.' },
					{ title: 'Meeting the Mentor', summary: 'A guide provides preparation, tools, or wisdom.' },
					{ title: 'Crossing the Threshold', summary: 'The hero commits and enters the unknown world.' },
					{ title: 'Tests, Allies, Enemies', summary: 'The hero learns the rules of the new world — who to trust and who to fear.' },
					{ title: 'Approach to the Inmost Cave', summary: 'The hero nears the central challenge, often at great risk.' },
					{ title: 'The Ordeal', summary: 'A severe test — death and rebirth, literal or figurative.' },
					{ title: 'The Reward', summary: 'The hero claims a treasure, knowledge, or power.' },
					{ title: 'The Road Back', summary: 'The hero tries to return, pursued by remaining threats.' },
					{ title: 'The Resurrection', summary: 'A final, purifying test — the hero must apply what they\'ve learned.' },
					{ title: 'Return with the Elixir', summary: 'The hero brings wisdom, peace, or transformation back home.' },
				],
			},
		],
		// characters: [
		// 	{ name: 'Hero', role: 'protagonist' },
		// 	{ name: 'Mentor', role: 'supporting' },
		// 	{ name: 'Shadow', role: 'antagonist' },
		// ],
	},
	{
		id: 'save-the-cat',
		name: 'Save the Cat',
		description: 'Blake Snyder\'s 15-beat method — precise story beats from opening image to finale.',
		icon: 'M2 12L6 8M2 12l4 4M12 2l4 4M12 2l-4 4M22 12l-4 4M22 12l-4-4',
		acts: [
			{
				title: 'Act I',
				scenes: [
					{ title: 'Opening Image', summary: 'A snapshot of the hero\'s life before the transformation begins.' },
					{ title: 'Theme Stated', summary: 'A hint of what the hero must learn — often stated by another character.' },
					{ title: 'Set-Up', summary: 'Introduce the hero\'s world, flaws, and what\'s missing in their life.' },
					{ title: 'Catalyst', summary: 'An event that propels the hero into action. The story really starts.' },
					{ title: 'Debate', summary: 'The hero questions whether to take on the challenge ahead.' },
					{ title: 'Break into Two', summary: 'The hero decides to act and enters a new world.' },
				],
			},
			{
				title: 'Act II',
				scenes: [
					{ title: 'B Story', summary: 'A new character or relationship enters — often the love interest or ally.' },
					{ title: 'Fun and Games', summary: 'The hero explores the new world. The promise of the premise delivered.' },
					{ title: 'Midpoint', summary: 'A major victory or defeat raises the stakes and shifts the goal.' },
					{ title: 'Bad Guys Close In', summary: 'Internal doubt and external opposition both tighten their grip.' },
					{ title: 'All Is Lost', summary: 'The hero hits a low point. A whiff of death — literal or symbolic.' },
					{ title: 'Dark Night of the Soul', summary: 'The hero grieves, reflects, and searches for a way forward.' },
				],
			},
			{
				title: 'Act III',
				scenes: [
					{ title: 'Break into Three', summary: 'A fresh idea or inspiration sparks the final plan.' },
					{ title: 'Finale', summary: 'The hero applies everything they\'ve learned to resolve the central conflict.' },
					{ title: 'Final Image', summary: 'A snapshot showing how the hero has changed — the opposite of the opening.' },
				],
			},
		],
	},
	{
		id: 'freytag',
		name: 'Freytag\'s Pyramid',
		description: 'Five-act dramatic arc: exposition, rising action, climax, falling action, dénouement.',
		icon: 'M2 20L8 4l4 8 4-6 6 14',
		acts: [
			{
				title: 'Act I — Exposition',
				scenes: [
					{ title: 'Setting the Stage', summary: 'Introduce the time, place, and atmosphere of the story.' },
					{ title: 'Key Characters', summary: 'Meet the protagonist and the important figures around them.' },
					{ title: 'Inciting Incident', summary: 'The event that sets the story in motion.' },
				],
			},
			{
				title: 'Act II — Rising Action',
				scenes: [
					{ title: 'Complications', summary: 'Obstacles arise as the protagonist pursues their goal.' },
					{ title: 'Rising Stakes', summary: 'The cost of failure becomes increasingly severe.' },
					{ title: 'Subplots Emerge', summary: 'Secondary storylines intersect with the main plot.' },
					{ title: 'Tension Builds', summary: 'Events accelerate toward the breaking point.' },
				],
			},
			{
				title: 'Act III — Climax',
				scenes: [
					{ title: 'The Turning Point', summary: 'The protagonist\'s fate hangs in the balance.' },
					{ title: 'The Climactic Moment', summary: 'The decisive confrontation — physical or emotional.' },
				],
			},
			{
				title: 'Act IV — Falling Action',
				scenes: [
					{ title: 'Immediate Aftermath', summary: 'The consequences of the climax begin to unfold.' },
					{ title: 'Loose Ends Tied', summary: 'Secondary conflicts find resolution.' },
					{ title: 'The Last Obstacle', summary: 'A final challenge before peace can settle.' },
				],
			},
			{
				title: 'Act V — Dénouement',
				scenes: [
					{ title: 'Resolution', summary: 'The central conflict is put to rest.' },
					{ title: 'New Equilibrium', summary: 'Life settles into a changed normal.' },
				],
			},
		],
	},
	{
		id: 'seven-point',
		name: '7-Point',
		description: 'Lean, modern structure — hook, turns, pinch points, midpoint, resolution.',
		icon: 'M12 2l2.5 5L20 7.5 15.5 12 20 16.5 14.5 17 12 22 9.5 17 4 16.5 8.5 12 4 7.5 9.5 7 12 2z',
		acts: [
			{
				title: 'The Arc',
				scenes: [
					{ title: 'Hook', summary: 'The protagonist in their starting state — strengths, flaws, and stasis.' },
					{ title: 'Plot Turn 1', summary: 'An event forces the protagonist to step into the story.' },
					{ title: 'Pinch 1', summary: 'The antagonist or opposition applies pressure. Stakes become real.' },
					{ title: 'Midpoint', summary: 'The protagonist shifts from reaction to action. The goal becomes personal.' },
					{ title: 'Pinch 2', summary: 'A major setback tests the protagonist\'s resolve. Defeat feels certain.' },
					{ title: 'Plot Turn 2', summary: 'The protagonist gains the final piece — knowledge, ally, or resolve — needed to win.' },
					{ title: 'Resolution', summary: 'The protagonist succeeds or fails, transformed by the journey.' },
				],
			},
		],
	},
];

export default templates;

/**
 * Create a new story from a template.
 * Returns a fully populated Story ready to save.
 */
export function createStoryFromTemplate(templateId: string, title = 'Untitled Story'): Story {
	const template = templates.find((t) => t.id === templateId);
	if (!template) throw new Error(`Template "${templateId}" not found.`);

	const story = createStory(title);
	story.acts = [];
	story.characters = [];

	if (template.characters) {
		for (const tc of template.characters) {
			story.characters.push({
				id: crypto.randomUUID(),
				name: tc.name,
				role: tc.role,
				description: '',
				arc: '',
			});
		}
	}

	for (let ai = 0; ai < template.acts.length; ai++) {
		const ta = template.acts[ai];
		const act = {
			id: crypto.randomUUID(),
			title: ta.title,
			order: ai,
			scenes: [] as import('./story').Scene[],
		};
		for (let si = 0; si < ta.scenes.length; si++) {
			const ts = ta.scenes[si];
			act.scenes.push(createScene(ai, si, ts.title, ts.summary));
		}
		story.acts.push(act);
	}

	return story;
}
