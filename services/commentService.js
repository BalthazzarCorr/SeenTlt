let comments = (()=>{

    const auth = 'kinvey';
    const module = 'appdata';

    function getPostComments(postId) {
        const endpoint = `comments?query={"postId":"${postId}"}&sort={"_kmd.ect": -1}`;
        return remote.get(module, endpoint, auth);
    }

    function createComment(postId, content, author) {
        const endpoint = 'comments';
        let data = { postId, content, author };

        return remote.post(module, endpoint, auth, data);
    }

    function deleteComment(commentId) {
        const endpoint = `comments/${commentId}`;
        return remote.remove(module, endpoint, auth);
    }



    return {
        getPostComments,
        createComment,
        deleteComment
    }

})();