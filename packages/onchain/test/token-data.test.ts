import test from "ava";
import { getRPCURL } from "./_utils";
import { createPublicClient, http, PublicClient } from "viem";

import { base, mainnet, polygon } from "viem/chains";
import { tokenData } from "../src/token-data";
import {
  ERC1155TokenData,
  ERC20TokenData,
  ERC721TokenData,
} from "../src/constant";

test("ERC20 - should return token data with type", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
  )) as ERC20TokenData;

  t.like(result, {
    type: {
      type: "ERC20",
    },
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  });
  t.truthy(result.totalSupply, "totalSupply should not be empty");
});

test("ERC721 - should return token data with type", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // BAYC
    1,
  )) as ERC721TokenData;

  t.truthy(result.owner);
  t.truthy(result.tokenURI);
  t.deepEqual(result.type, {
    type: "ERC721",
    subTypes: ["IERC721Metadata", "IERC721Enumerable"],
  });
});

test("ERC721 - should fetch token metadata when includeTokenMetadata is true", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // BAYC
    1,
    { includeTokenMetadata: true },
  )) as ERC721TokenData;

  t.truthy(result.tokenMetadata);
});

test("ERC721 - should parse embedded base64 metadata", async (t) => {
  const client = createPublicClient({
    chain: base,
    transport: http(getRPCURL(8453)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0x9bf1f7c9228baab6ffa2d17df5b7803ef6e585b2",
    1,
    { includeTokenMetadata: true },
  )) as ERC721TokenData;

  t.truthy(result.tokenMetadata);
});

test("ERC721 - should fetch token metadata with custom ipfs gateway", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // BAYC
    1,
    { includeTokenMetadata: true, ipfsGatewayDomain: "https://dweb.link" },
  )) as ERC721TokenData;

  t.truthy(result.tokenMetadata);
});

test("ERC721 - should fetch token metadata with custom fetch handler", async (t) => {
  const client = createPublicClient({
    chain: polygon,
    transport: http(getRPCURL(137)),
  });

  const fetchHandler = async (url: string) => {
    const response = await fetch(url);
    return { ...(await response.json()), custom: true };
  };

  const result = (await tokenData(
    client as PublicClient,
    "0xD5cA946AC1c1F24Eb26dae9e1A53ba6a02bd97Fe", // Smart Cat
    1997912245,
    { includeTokenMetadata: true, fetchHandler },
  )) as ERC721TokenData;

  t.like(result.tokenMetadata, { custom: true });
});

test("ERC721 - should fetch contract metadata when includeContractMetadata is true", async (t) => {
  const client = createPublicClient({
    chain: polygon,
    transport: http(getRPCURL(137)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0xD5cA946AC1c1F24Eb26dae9e1A53ba6a02bd97Fe", // Smart Cat
    1997912245,
    { includeContractMetadata: true },
  )) as ERC721TokenData;

  t.truthy(result.contractMetadata);
});

test("ERC1155 - should return token data with type", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0x3e34ff1790bf0a13efd7d77e75870cb525687338",
    1,
  )) as ERC1155TokenData;

  t.truthy(result.uri);
  t.deepEqual(result.type, {
    type: "ERC1155",
    subTypes: ["IERC1155Metadata_URI"],
  });
});

test("ERC1155 - should fetch token metadata when includeTokenMetadata is true", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const result = (await tokenData(
    client as PublicClient,
    "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    1,
    { includeTokenMetadata: true },
  )) as ERC1155TokenData;

  t.truthy(result.tokenMetadata);
});

test("UNKNOWN - should throw error", async (t) => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(getRPCURL(1)),
  });

  const error = await t.throwsAsync(
    async () =>
      await tokenData(
        client as PublicClient,
        "0xae749AE248d9c7014b6a2E951542cdAa619e14C1",
        1,
      ),
  );

  t.is(error.message, "Unsupported token type");
});
