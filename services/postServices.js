let postService = (() => {

    const auth = 'kinvey';
    const module = 'appdata';

        function getAllPosts() {
            const endpoint = 'posts?query={}&sort={"_kmd.ect": -1}';
            return remote.get(module, endpoint, auth);
        }

        function createPost(author, title, description, url, imgUrl) {
            let data = {
                author,
                title,
                description,
                url,
                imgUrl
            };
            return remote.post(module, 'posts', auth, data)
        }

        function editPost(postId, author, title, description, url, imgUrl) {
            const endpoint = `posts/${postId}`;
            let data = {
                author,
                title,
                description,
                url,
                imgUrl
            };

            return remote.update(module, endpoint, auth, data)
        }

        function deletePost(postId) {
            const endpoint = `posts/${postId}`;
            return remote.remove(module, endpoint, auth)
        }

        function myPosts(username) {
            const endpoint = `posts?query={"author":"${username}"}&sort={"_kmd.ect": -1}`;
            return remote.get(module,endpoint,auth)
        }

        function getPostById(postId) {
            const endpoint = `posts/${postId}`;

            return remote.get(module,endpoint,auth)

        }

        return {
            getAllPosts,
            createPost,
            editPost,
            deletePost,
            myPosts,
            getPostById
        }

    }

)();