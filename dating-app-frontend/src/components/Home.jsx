import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";

const Home = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <h1 className="text-3xl font-bold mb-4">Welcome to the Dating App</h1>

    <SignedIn>
      <p className="text-lg">
        You are signed in! <a href="/app" className="text-blue-500 underline">Go to Dashboard</a>
      </p>
    </SignedIn>

    <SignedOut className="space-x-4">
      <SignInButton>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Sign In</button>
      </SignInButton>
      <SignUpButton>
        <button className="px-4 py-2 bg-green-500 text-white rounded">Sign Up</button>
      </SignUpButton>
    </SignedOut>
  </div>
);

export default Home;
