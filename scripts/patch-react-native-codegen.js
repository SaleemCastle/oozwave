const fs = require('fs');
const path = require('path');

// Current Ruby versions require ERB's trim mode as a keyword argument.
const scriptPhasesPath = path.join(
  __dirname, '..', 'node_modules', 'react-native', 'scripts',
  'react_native_pods_utils', 'script_phases.rb',
);
if (fs.existsSync(scriptPhasesPath)) {
  const contents = fs.readFileSync(scriptPhasesPath, 'utf8');
  const updated = contents.replace(
    "ERB.new(template, 0, '->')",
    "ERB.new(template, trim_mode: '->')",
  );
  if (updated !== contents) fs.writeFileSync(scriptPhasesPath, updated);
}

const boostPodspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'third-party-podspecs',
  'boost.podspec',
);

const fbSpecPodspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'React',
  'FBReactNativeSpec',
  'FBReactNativeSpec.podspec',
);

// Historically we attempted to patch `FBReactNativeSpec.podspec` to
// normalize `use_react_native_codegen!` invocations. That proved
// fragile across React Native versions and caused CocoaPods arity
// errors during `pod install` (wrong number of arguments).
// To avoid breaking the podspec, skip editing it here.

if (fs.existsSync(boostPodspecPath)) {
  const boostContents = fs.readFileSync(boostPodspecPath, 'utf8');
  let updated = boostContents.replace(
    /:http => 'https:\/\/boostorg\.jfrog\.io\/artifactory\/main\/release\/1\.76\.0\/source\/boost_1_76_0\.tar\.bz2'/,
    ":http => 'https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2'",
  );
  updated = updated.replace(
    /:sha256 => '[0-9a-f]+'/,
    ":sha256 => 'f0397ba6e982c4450f27bf32a2a83292aba035b827a5623a14636ea583318c41'",
  );
  if (updated !== boostContents) {
    fs.writeFileSync(boostPodspecPath, updated);
  }
}
