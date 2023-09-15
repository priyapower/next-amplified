import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify, API, Auth, withSSRContext } from "aws-amplify";
import Head from "next/head";
import awsExports from "@/aws-exports";
import { createPost } from "@/graphql/mutations";
import { listPosts } from "@/graphql/queries";
import styles from "../styles/Home.module.css";

// For authenticated requests to work on the server,
// your client has to be configured with ssr: true
// to make credentials available on subsequent requests.
Amplify.configure({ ...awsExports, ssr: true });

// For each request (req) on the server,
// you create a copy of Amplify
// const SSR = withSSRContext({ req })
// that scopes credentials, data, and storage to just one request.
// API.graphql queries for a list of posts,
// and returns them as the posts prop for the Home component.
export async function getServerSideProps({ req }) {
  const SSR = withSSRContext({ req });

  try {
    const response = await SSR.API.graphql({
      query: listPosts,
      authMode: "API_KEY",
    });
    return {
      props: {
        posts: response.data.listPosts.items,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {},
    };
  }
}

// This function is called when a logged-in user submits a
// "New Post" form. API.graphql is called to create the new post's
// title and content. Once created, you redirect to
// /posts/${post.id}. Notice that you explicitly set authMode to
// AMAZON_COGNITO_USER_POOLS. This is because your schema.graphql
// explicitly requires an authorized user to create/delete/update
//  your Post model. Based on your configuration when you ran
// `amplify add api`, this value is defaulting to API_KEY.
async function handleCreatePost(event) {
  event.preventDefault();

  const form = new FormData(event.target);

  try {
    const { data } = await API.graphql({
      authMode: "AMAZON_COGNITO_USER_POOLS",
      query: createPost,
      variables: {
        input: {
          title: form.get("title"),
          content: form.get("content"),
        },
      },
    });

    window.location.href = `/posts/${data.createPost.id}`;
  } catch ({ errors }) {
    console.error(...errors);
    throw new Error(errors[0].message);
  }
}

// This is a functional component that renders
// the posts provided by getServerSideProps.
export default function Home({ posts = [] }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Amplify + Next.js</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Amplify + Next.js</h1>

        <p className={styles.description}>
          <code className={styles.code}>{posts.length}</code>
          posts
        </p>

        <div className={styles.grid}>
          {posts.map((post) => (
            <a className={styles.card} href={`/posts/${post.id}`} key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </a>
          ))}

          <div className={styles.card}>
            <h3 className={styles.title}>New Post</h3>

            <Authenticator>
              <form onSubmit={handleCreatePost}>
                <fieldset>
                  <legend>Title</legend>
                  <input
                    defaultValue={`Today, ${new Date().toLocaleTimeString()}`}
                    name="title"
                  />
                </fieldset>

                <fieldset>
                  <legend>Content</legend>
                  <textarea
                    defaultValue="I built an Amplify project with Next.js!"
                    name="content"
                  />
                </fieldset>

                <button>Create Post</button>
                <button type="button" onClick={() => Auth.signOut()}>
                  Sign out
                </button>
              </form>
            </Authenticator>
          </div>
        </div>
      </main>
    </div>
  );
}
