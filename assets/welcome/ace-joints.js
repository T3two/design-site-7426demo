import * as THREE from 'three';

// Add independent pivots to the team's ORIGINAL Ace mesh pieces.
// Meshes are attached without editing geometry, UVs, or materials, so Ace keeps
// the same silhouette, face, glasses, and authored seated/pointing poses.
// This is an articulated part rig, not a skin-weight deformation rig.
export function rigOriginalAce(model) {
  const defs = [
    ['hips', null, [0,1.65,0]],
    ['spine','hips',[0,1.85,0]],
    ['neck','spine',[0,3.07,0]],
    ['head','neck',[0,3.54,0]],
    ['leftShoulder','spine',[-.72,2.72,.12]],
    ['leftElbow','leftShoulder',[-1.07,2.48,.33]],
    ['leftWrist','leftElbow',[-1.58,2.53,.54]],
    ['leftFingers','leftWrist',[-1.94,2.75,.64]],
    ['rightShoulder','spine',[.72,2.72,.12]],
    ['rightElbow','rightShoulder',[1.07,2.44,.33]],
    ['rightWrist','rightElbow',[1.55,2.45,.55]],
    ['rightFingers','rightWrist',[1.84,2.54,.64]],
    ['leftHip','hips',[-.315,1.52,.06]],
    ['leftKnee','leftHip',[-.315,.82,.21]],
    ['leftAnkle','leftKnee',[-.315,.32,.40]],
    ['rightHip','hips',[.315,1.52,.06]],
    ['rightKnee','rightHip',[.315,.82,.21]],
    ['rightAnkle','rightKnee',[.315,.32,.40]]
  ];
  model.updateMatrixWorld(true);
  const originalMeshes=[];
  model.traverse(o=>{
    if(o.isMesh && o.name!=='AceGraphicInkSilhouette' &&
       !o.userData?.aceJointDecoration) originalMeshes.push(o);
  });
  const joints={}, rest={};
  for(const [name,parent,position] of defs){
    const pivot=new THREE.Group();
    pivot.name='AceJoint_'+name;
    pivot.position.set(...position);
    if(parent){
      const base=rest[parent];
      pivot.position.sub(base);
      joints[parent].add(pivot);
    }else model.add(pivot);
    rest[name]=new THREE.Vector3(...position);
    joints[name]=pivot;
  }
  // Determine the semantic parent name. glTF exporters sometimes assign a
  // generic "mesh_0" leaf name and keep the useful part name on its parent.
  function semanticName(mesh){
    const namePattern=/(head|glass|sunglass|wink|eye|freckle|hood|torso|pocket|backpack|strap|charm|sleeve|upper|elbow|forearm|cuff|glove|hand|finger|thigh|short|leg|shin|knee|sock|shoe|sole|toe|foot|waist|neck|hip|dice_top|dice_head|face)/i;
    for(let p=mesh,i=0;p&&p!==model&&i<4;p=p.parent,i++){
      if(namePattern.test(p.name||''))return p.name.toLowerCase();
    }
    return (mesh.name||'').toLowerCase();
  }
  const centers={};
  for(const mesh of originalMeshes){
    const nm=semanticName(mesh);
    const box=new THREE.Box3().setFromObject(mesh);
    const midpoint=box.isEmpty()?new THREE.Vector3():box.getCenter(new THREE.Vector3());
    const local=model.worldToLocal(midpoint.clone());
    const side=/^(?:r_|right[_-])|[_-]right\b|[_-]r\b/.test(nm)?'right':
      /^(?:l_|left[_-])|[_-]left\b|[_-]l\b/.test(nm)?'left':
      local.x>0?'right':'left';
    let dest=null;
    if(/head_white|dice_head|glasses|sunglasses|wink|open_eye|freckle|dice_top_marks|temple_arm|head_face/.test(nm))
      dest='head';
    else if(/finger_tip|pointing_finger|index_finger|thumb/.test(nm))
      dest=side+'Fingers';
    else if(/hand|glove|cuff/.test(nm))
      dest=side+'Wrist';
    else if(/forearm|elbow|lower_arm/.test(nm))
      dest=side+'Elbow';
    else if(/sleeve|upper_arm|shoulder|crossed_arm/.test(nm))
      dest=side+'Shoulder';
    else if(/shoe|sole|sock|toe|ankle|foot/.test(nm))
      dest=side+'Ankle';
    else if(/legging|shin|knee|lower_leg/.test(nm))
      dest=side+'Knee';
    else if(/short_leg|shorts|thigh|upper_leg|hip|leg/.test(nm))
      dest=side+'Hip';
    else if(/hood|torso|pocket|waist|backpack|bag_strap|charm|neck_gap/.test(nm))
      dest='spine';
    else if(/neck/.test(nm))
      dest='neck';
    if(dest && joints[dest]){
      joints[dest].attach(mesh); // preserves the old authored WORLD pose
      centers[dest]=(centers[dest]||0)+1;
    }
  }
  model.updateMatrixWorld(true);
  return {joints,partCounts:centers,jointCount:defs.length,
    activeJoints:Object.keys(centers).length,sourceMeshes:originalMeshes.length};
}

export function resetAceJointRotations(joints){
  if(!joints)return;
  for(const joint of Object.values(joints))joint.rotation.set(0,0,0);
}
