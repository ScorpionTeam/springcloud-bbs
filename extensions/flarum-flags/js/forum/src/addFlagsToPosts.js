import { extend } from 'flarum/extend';
import app from 'flarum/app';
import CommentPost from 'flarum/components/CommentPost';
import Button from 'flarum/components/Button';
import punctuate from 'flarum/helpers/punctuate';
import username from 'flarum/helpers/username';
import ItemList from 'flarum/utils/ItemList';
import PostControls from 'flarum/utils/PostControls';

export default function() {
  extend(CommentPost.prototype, 'attrs', function(attrs) {
    if (this.props.post.flags().length) {
      attrs.className += ' Post--flagged';
    }
  });

  CommentPost.prototype.dismissFlag = function(data) {
    const post = this.props.post;

    delete post.data.relationships.flags;

    this.subtree.invalidate();

    if (app.cache.flags) {
      app.cache.flags.some((flag, i) => {
        if (flag.post() === post) {
          app.cache.flags.splice(i, 1);

          if (app.cache.flagIndex === post) {
            let next = app.cache.flags[i];

            if (!next) next = app.cache.flags[0];

            if (next) {
              const nextPost = next.post();
              app.cache.flagIndex = nextPost;
              m.route(app.route.post(nextPost));
            }
          }

          return true;
        }
      });
    }

    return app.request({
      url: app.forum.attribute('apiUrl') + post.apiEndpoint() + '/flags',
      method: 'DELETE',
      data
    });
  };

  CommentPost.prototype.flagActionItems = function() {
    const items = new ItemList();

    const controls = PostControls.destructiveControls(this.props.post);

    Object.keys(controls.items).forEach(k => {
      const props = controls.get(k).props;

      props.className = 'Button';

      extend(props, 'onclick', () => this.dismissFlag());
    });

    items.merge(controls);

    items.add('dismiss', <Button className="Button Button--icon Button--link" icon="times" onclick={this.dismissFlag.bind(this)} title={app.translator.trans('flarum-flags.forum.post.dismiss_flag_tooltip')}/>, -100);

    return items;
  };

  extend(CommentPost.prototype, 'content', function(vdom) {
    const post = this.props.post;
    const flags = post.flags();

    if (!flags.length) return;

    if (post.isHidden()) this.revealContent = true;

    vdom.unshift(
      <div className="Post-flagged">
        <div className="Post-flagged-flags">
          {flags.map(flag =>
            <div className="Post-flagged-flag">
              {this.flagReason(flag)}
            </div>
          )}
        </div>
        <div className="Post-flagged-actions">
          {this.flagActionItems().toArray()}
        </div>
      </div>
    );
  });

  CommentPost.prototype.flagReason = function(flag) {
    if (flag.type() === 'user') {
      const user = flag.user();
      const reason = flag.reason();
      const detail = flag.reasonDetail();

      return [
        app.translator.trans(reason ? 'flarum-flags.forum.post.flagged_by_with_reason_text' : 'flarum-flags.forum.post.flagged_by_text', {user, reason}),
        detail ? <span className="Post-flagged-detail">{detail}</span> : ''
      ];
    }
  };
}
