const ApplicationPolicy = require("./application");

module.exports = class PostPolicy extends ApplicationPolicy {

    _isMember() {
        return this.user && this.user.role == "member";
    }

    new() {
        return this._isAdmin() || this._isMember();
    }

    create() {
        return this.new();
    }

    edit() {
        return this._isAdmin() || (this._isMember() && this._isOwner());
    }

    update() {
        return this.edit();
    }

    destroy() {
        return this.update();
    }
}