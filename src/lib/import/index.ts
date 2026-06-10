import { saveStory, saveScreenplay } from '$lib/persistence/db';
import type { Story, Screenplay, Act, Scene, Character } from '$lib/domain/story';

export interface ActFile {
	format: 'act';
	version: 1;
	story: Story;
	screenplay: Screenplay | null;
}

export class ActImportError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ActImportError';
	}
}

/**
 * Read and parse an .act file from a File object.
 */
export function readActFile(file: File): Promise<ActFile> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result as string);
				validateActFile(data);
				resolve(data as ActFile);
			} catch (e) {
				if (e instanceof ActImportError) reject(e);
				else reject(new ActImportError('Invalid .act file: could not parse JSON'));
			}
		};
		reader.onerror = () => reject(new ActImportError('Failed to read file'));
		reader.readAsText(file);
	});
}

function validateActFile(data: unknown): asserts data is ActFile {
	if (!data || typeof data !== 'object') {
		throw new ActImportError('Invalid .act file: not a JSON object');
	}
	const obj = data as Record<string, unknown>;
	if (obj.format !== 'act') {
		throw new ActImportError('Invalid .act file: format must be "act"');
	}
	if (obj.version !== 1) {
		throw new ActImportError(`Unsupported .act version: ${obj.version}`);
	}
	if (!obj.story || typeof obj.story !== 'object') {
		throw new ActImportError('Invalid .act file: missing story');
	}
	const story = obj.story as Record<string, unknown>;
	if (typeof story.title !== 'string') {
		throw new ActImportError('Invalid .act file: story must have a title');
	}
}

/**
 * Import an .act file into IndexedDB, generating fresh IDs to avoid collisions.
 * Returns the new story ID so the caller can navigate to it.
 */
export async function importActFile(file: File): Promise<string> {
	const data = await readActFile(file);
	const { story: importedStory, screenplay: importedScreenplay } = data;

	// Map old IDs -> new IDs to remap all references
	const idMap = new Map<string, string>();

	// ── Story ──
	const newStoryId = crypto.randomUUID();
	idMap.set(importedStory.id, newStoryId);

	// ── Characters ──
	const oldCharIds = importedStory.characters.map((c) => c.id);
	const newCharacters: Character[] = importedStory.characters.map((c) => ({
		...c,
		id: crypto.randomUUID(),
	}));
	oldCharIds.forEach((oldId, i) => idMap.set(oldId, newCharacters[i].id));

	// ── Acts & Scenes ──
	const newActs: Act[] = importedStory.acts.map((act) => {
		const newActId = crypto.randomUUID();
		idMap.set(act.id, newActId);

		const newScenes: Scene[] = act.scenes.map((scene) => {
			const newSceneId = crypto.randomUUID();
			idMap.set(scene.id, newSceneId);
			return {
				...scene,
				id: newSceneId,
				characters: scene.characters.map((charId) => idMap.get(charId) ?? charId),
			};
		});

		return {
			...act,
			id: newActId,
			scenes: newScenes,
		};
	});

	// ── Reconstruct story with fresh IDs ──
	const newStory: Story = {
		...importedStory,
		id: newStoryId,
		characters: newCharacters,
		acts: newActs,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};

	await saveStory(newStory);

	// ── Save screenplay if present ──
	if (importedScreenplay) {
		const newScreenplay: Screenplay = {
			...importedScreenplay,
			id: crypto.randomUUID(),
			storyId: newStoryId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		await saveScreenplay(newScreenplay);
	}

	return newStoryId;
}
