import {
  Camera,
  FileText,
  Send,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useSelector } from "react-redux";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { handleGetUserNameInitials } from "@/app/helpers/userHelper";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createFeedPost,
  listenPostsByUserIds,
  getUserIdsFromLinkIds
} from "@/app/controllers/feedController";
import { FeedPostType } from "@/lib/firebase/models";
import { FeedSkeleton } from "./feedSkeleton";
import { PostCard } from "./postCard";
import { uploadFileToStorage } from "@/lib/firebase/firebase-functions";
import { useUser } from "@/hooks/useUsers"; 
import { reconcileUserListeners } from "@/lib/listeners/useLiveManager";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectFriends } from "@/lib/redux/slices/friendsSlice";

export const Feed = () => {
  const currentUser = useSelector(selectUser);
  const [postMessage, setPostMessage] = useState<string>("");
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [friendsUserIds, setFriendsUserIds] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // 🔹 Gestion de l'upload (image ou document)
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "document"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFileToStorage(
        file,
        type === "image" ? "feed-images" : "feed-documents"
      );
      setSelectedFile(file);
      setFileUrl(url);
    } catch (err) {
      console.error("Erreur lors de l'upload :", err);
    }
  };

  // 🔹 Supprimer le fichier uploadé
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileUrl(null);
  };

  const authorizedUserIds = useMemo(() => {
  if (!currentUser?.id) return [];
  return Array.from(new Set([currentUser.id, ...(currentUser.friends ?? [])]));
}, [currentUser?.id, currentUser?.friends]);

  useEffect(() => {
  if (authorizedUserIds.length === 0) {
    setPosts([]);
    return;
  }

  setLoading(true);

  const unsubscribe = listenPostsByUserIds(authorizedUserIds, (posts) => {
    setPosts(posts);
    setLoading(false);
  });

    return () => {
      unsubscribe();
    };
  }, [authorizedUserIds]); // Se déclenche quand authorizedUserIds change


const handleSubmitInput = async () => {
  if (!currentUser?.id || (!postMessage.trim() && !fileUrl)) return;

  const newPost: FeedPostType = {
    authorId: currentUser.id,
    destinatorId: currentUser.id,
    content: postMessage.trim(),
    image: selectedFile?.type.startsWith("image/") ? fileUrl ?? "" : "",
    documentUrl:
      selectedFile &&
      !selectedFile.type.startsWith("image/") &&
      fileUrl
        ? fileUrl
        : undefined,
    documentName:
      selectedFile && !selectedFile.type.startsWith("image/")
        ? selectedFile.name
        : undefined,
    createdAt: Date.now(),
    timeAgo: "À l'instant",
    likesIds: [],
    comments: [],
    privacy: "public",
    isOnWall: true,
  };

  try {
    const cleanPost = Object.fromEntries(
      Object.entries(newPost).filter(([_, v]) => v !== undefined)
    ) as FeedPostType;

    const postId = await createFeedPost(cleanPost);

    const postWithId = { ...cleanPost, id: postId };

    // 🔹 Ajouter l’auteur dans le store pour qu’on le voie dans le feed
    reconcileUserListeners([currentUser.id]);

    // 🔹 Mettre à jour le state local pour l’afficher immédiatement
    setPosts((prev) => [postWithId, ...prev]);

    setPostMessage("");
    setSelectedFile(null);
    setFileUrl(null);
  } catch (err) {
    console.error("Erreur lors de la création du post :", err);
  }
};

  return (
    <div className="animate-fade-in">
      <div className="min-h-screen">
        <main className="w-2/3 mx-auto">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 animate-slide-up">
              Fil d'actualité
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Zone de création de post */}
                <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="animate-scale-in">
                        <AvatarImage src={currentUser?.avatarUrl} />
                        <AvatarFallback>
                          {currentUser &&
                            handleGetUserNameInitials(currentUser)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        {/* Aperçu du fichier au-dessus */}
                        {fileUrl && (
                          <div className="relative mb-3 inline-block">
                            {selectedFile?.type.startsWith("image/") ? (
                              <div className="relative inline-block">
                                <img
                                  src={fileUrl}
                                  alt="aperçu"
                                  className="rounded-lg border border-gray-200 shadow-sm max-w-28 max-h-32 object-cover"
                                />
                                <button
                                  onClick={handleRemoveFile}
                                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                                >
                                  <X className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2 border border-gray-200 relative">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 font-medium truncate max-w-[80%]"
                                >
                                  {selectedFile?.name}
                                </a>
                                <button
                                  onClick={handleRemoveFile}
                                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                                >
                                  <X className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Input texte */}
                        <div className="relative">
                          <Input
                            placeholder="Partagez une découverte ou une histoire familiale..."
                            className="bg-gray-100 pr-10"
                            value={postMessage}
                            onChange={(e) => setPostMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSubmitInput();
                            }}
                          />
                          <Send
                            className="absolute w-5 h-5 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 cursor-pointer transition-all duration-200 ease-in-out hover:scale-110"
                            onClick={handleSubmitInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Boutons photo / document */}
                    <div className="flex w-full justify-center mt-4 pt-4 border-t border-gray-100">
                      <div className="flex w-1/2 items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" /> Photo
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => docInputRef.current?.click()}
                        >
                          <FileText className="h-4 w-4 mr-2" /> Document
                        </Button>
                      </div>
                    </div>

                    {/* Inputs cachés */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "image")}
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "document")}
                    />
                  </CardContent>
                </Card>

                {/* Liste des posts */}
                {loading ? (
                  <FeedSkeleton />
                ) : posts.length === 0 ? (
                  <Card className="p-12 text-center bg-white/80">
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Aucun post pour le moment
                    </p>
                    <p className="text-gray-500">
                      {friendsUserIds.length === 0
                        ? "Ajoutez des amis pour voir leur contenu !"
                        : "Soyez le premier à partager quelque chose !"}
                    </p>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        isOnWall: post.authorId !== post.destinatorId,
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};