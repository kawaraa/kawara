class Profile {
  constructor(profile) {
    this.firstName = profile.firstName;
    this.lastName = profile.lastName;
    this.displayName = profile.displayName;
    this.gender = profile.gender;
    this._birthday = profile.birthday;
    this.about = profile.about;
    this._activities = profile.activities;
    this.avatarUrl = profile.avatarUrl;
    this.photoUrls = profile.photoUrls;
    this.status = profile.status;
  }
  set _birthday(value) {
    const date = new Date(value);
    this.birthday = date.toLocaleDateString("default", { month: "long", day: "numeric" });
  }
  set _activities(value) {
    this.activities = Validator.stringToArray(value);
  }
}
module.exports = Profile;
