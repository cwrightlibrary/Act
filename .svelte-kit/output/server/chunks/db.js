import Dexie from "dexie";
//#region src/lib/persistence/db.ts
var db = new Dexie("StoryBuilder");
db.version(1).stores({ stories: "id, title, updatedAt, createdAt" });
db.version(2).stores({
	stories: "id, title, updatedAt, createdAt",
	screenplays: "id, storyId, title, updatedAt, createdAt"
});
function getAllStories() {
	return db.stories.orderBy("updatedAt").reverse().toArray();
}
function getAllScreenplays() {
	return db.screenplays.toArray();
}
//#endregion
export { getAllStories as n, getAllScreenplays as t };
