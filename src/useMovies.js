import { useState, useEffect, useRef } from "react";

const omdbKey = "4e73b5d8";

export function useMovies(query, callback) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  //Fetch Query Movies
  useEffect(() => {
    callback?.();

    const controller = new AbortController();

    async function getMoviesAPI() {
      const apiRequest = `http://www.omdbapi.com/?apikey=${omdbKey}&s=${query}`;
      try {
        setIsLoading(true);
        setErrorMsg("");
        const res = await fetch(apiRequest, { signal: controller.signal });
        if (!res.ok) {
          throw new Error();
        }
        const data = await res.json();
        if (data.Response === "False") throw new Error("Movies not found!");
        setMovies(data.Search);
        setErrorMsg("");
      } catch (error) {
        if (error instanceof TypeError) {
          setErrorMsg("Connection Lost...");
        } else {
          if (error.name !== "AbortError") setErrorMsg(error.message); // Other errors, such as the custom ones thrown above
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (query.length < 3) {
      setErrorMsg("");
      setMovies([]);
      return;
    }

    getMoviesAPI();
    return function () {
      controller.abort();
    };
  }, [query]);

  return { movies, isLoading, errorMsg };
}
