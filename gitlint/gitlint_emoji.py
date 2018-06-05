"""
Gitlint extra rule to validate that the message title is of the form
"<gitmoji>(<scope>) <subject>"
"""
from __future__ import unicode_literals
import re

from gitlint.rules import CommitMessageTitle, LineRule, RuleViolation

regex = (
    "^(\U0001f3a8|\u26a1\ufe0f|\U0001f525|\U0001f41b|\U0001f691|\u2728|\U0001f4dd|\U0001f680|"
    "\U0001f484|\U0001f389|\u2705|\U0001f512|\U0001f34e|\U0001f427|\U0001f3c1|\U0001f916|"
    "\U0001f34f|\U0001f516|\U0001f6a8|\U0001f6a7|\U0001f49a|\u2b07\ufe0f|\u2b06\ufe0f|\U0001f4cc|"
    "\U0001f477|\U0001f4c8|\u267b\ufe0f|\u2796|\U0001f433|\u2795|\U0001f527|\U0001f310|\u270f"
    "\ufe0f|\U0001f4a9|\u23ea|\U0001f500|\U0001f4e6|\U0001f47d|\U0001f69a|\U0001f4c4|\U0001f4a5|"
    "\U0001f371|\U0001f44c|\u267f\ufe0f|\U0001f4a1|\U0001f37b|\U0001f4ac|\U0001f5c3|\U0001f50a|"
    "\U0001f507|\U0001f465|\U0001f6b8|\U0001f3d7|\U0001f4f1|\U0001f921|\U0001f95a|\U0001f648|"
    "\U0001f4f8)\(.*\)\s[a-z].*$"
)
pattern = re.compile(regex, re.UNICODE)


class GitmojiTitle(LineRule):
    """
    This rule will enforce that each commit title is of the form "<gitmoji>(<scope>) <subject>"
    where gitmoji is an emoji from the list defined in https://gitmoji.carloscuesta.me
    """

    id = "UC1"
    name = "title-should-have-gitmoji-and-scope"
    target = CommitMessageTitle

    def validate(self, title, _commit):
        if not pattern.search(title):
            violation_msg = "Title does not match regex <gitmoji>(<scope>) <subject>"
            return [RuleViolation(self.id, violation_msg, title)]
